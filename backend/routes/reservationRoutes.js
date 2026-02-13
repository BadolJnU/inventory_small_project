const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');

// Import models
const Drop = require('../models/Drop');
const Reservation = require('../models/Reservation');
const Purchase = require('../models/Purchase');
const User = require('../models/User');

/**
 * @route   GET /api/drops
 * @desc    Fetch all drops with the 3 most recent purchasers for the feed
 */
router.get('/drops', async (req, res) => {
  try {
    const drops = await Drop.findAll({
      include: [
        {
          model: Purchase,
          limit: 3,
          order: [['createdAt', 'DESC']],
          include: [{ model: User, attributes: ['username'] }]
        }
      ],
      order: [['id', 'ASC']]
    });
    res.status(200).json(drops);
  } catch (error) {
    console.error("Error fetching drops:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route   POST /api/reserve/:dropId
 * @desc    Atomic reservation with row locking and 60s auto-expiry
 */
router.post('/reserve/:dropId', async (req, res) => {
  const { dropId } = req.params;
  const t = await sequelize.transaction();

  try {
    // 1. SELECT FOR UPDATE (Locks the row in Postgres)
    const drop = await Drop.findByPk(dropId, {
      transaction: t,
      lock: t.LOCK.UPDATE 
    });

    if (!drop || drop.availableStock <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Item out of stock!' });
    }

    // 2. Atomic decrement
    drop.availableStock -= 1;
    await drop.save({ transaction: t });

    // 3. Create reservation record
    const expiresAt = new Date(Date.now() + 60000);
    const reservation = await Reservation.create({
      DropId: dropId,
      expiresAt: expiresAt,
      status: 'active'
    }, { transaction: t });

    await t.commit();

    // 4. Real-time broadcast: New Stock Level
    const io = req.app.get('socketio');
    io.emit('stock_updated', {
      dropId: drop.id,
      availableStock: drop.availableStock
    });

    // 5. Start Recovery Timer
    setTimeout(async () => {
      await expireReservation(reservation.id, dropId, io);
    }, 60000);

    res.status(200).json({ 
      message: 'Reserved!', 
      reservationId: reservation.id,
      expiresAt 
    });

  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/purchase/:reservationId
 * @desc    Finalize purchase and stop the recovery flow
 */
router.post('/purchase/:reservationId', async (req, res) => {
  const { reservationId } = req.params;
  const t = await sequelize.transaction();

  try {
    const reservation = await Reservation.findByPk(reservationId, { transaction: t });

    if (!reservation || reservation.status !== 'active') {
      await t.rollback();
      return res.status(400).json({ message: 'Reservation invalid or expired.' });
    }

    // Mark as completed so expireReservation() won't return stock
    reservation.status = 'completed';
    await reservation.save({ transaction: t });

    // Create purchase record (Associate with dummy user for demo)
    const user = await User.findOne(); // Get the seed user
    await Purchase.create({
      DropId: reservation.DropId,
      UserId: user ? user.id : null,
      status: 'success'
    }, { transaction: t });

    await t.commit();

    // Broadcast purchase event for the Activity Feed
    req.app.get('socketio').emit('new_purchase', {
      dropId: reservation.DropId,
      username: user ? user.username : 'Anonymous'
    });

    res.status(200).json({ message: 'Purchase successful!' });

  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Stock Recovery Logic
 * This returns stock to the pool if the user doesn't buy in time.
 */
async function expireReservation(resId, dropId, io) {
  try {
    const res = await Reservation.findByPk(resId);
    
    // Check if the reservation is still 'active'
    if (res && res.status === 'active') {
      res.status = 'expired';
      await res.save();

      const drop = await Drop.findByPk(dropId);
      if (drop) {
        drop.availableStock += 1;
        await drop.save();

        // CRITICAL: Emit the update so frontend sees the stock go back up
        io.emit('stock_updated', { 
          dropId: drop.id, 
          availableStock: drop.availableStock 
        });

        console.log(`[RECOVERY] Stock returned for Drop ${dropId}. Current: ${drop.availableStock}`);
      }
    }
  } catch (err) {
    console.error("Recovery failed:", err);
  }
}

module.exports = router;