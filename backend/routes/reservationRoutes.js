const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const Drop = require('../models/Drop');
const Reservation = require('../models/Reservation');
const Purchase = require('../models/Purchase');

router.post('/reserve/:dropId', async (req, res) => {
  const { dropId } = req.params;
  const t = await sequelize.transaction(); // Start Transaction

  try {
    // 1. Find the drop and LOCK the row so no other request can touch it
    const drop = await Drop.findByPk(dropId, {
      transaction: t,
      lock: t.LOCK.UPDATE 
    });

    if (!drop || drop.availableStock <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Item out of stock!' });
    }

    // 2. Decrease stock
    drop.availableStock -= 1;
    await drop.save({ transaction: t });

    // 3. Create reservation (Expires in 60 seconds)
    const expiresAt = new Date(Date.now() + 60000);
    const reservation = await Reservation.create({
      DropId: dropId,
      expiresAt: expiresAt,
      status: 'active'
    }, { transaction: t });

    // 4. Commit changes to DB
    await t.commit();

    // 5. Emit real-time update via Socket.io (we'll link this in server.js)
    req.app.get('socketio').emit('stock_updated', {
      dropId: drop.id,
      availableStock: drop.availableStock
    });

    // 6. Set a timeout to handle auto-expiry (Stock Recovery)
    setTimeout(async () => {
      await expireReservation(reservation.id, dropId, req.app.get('socketio'));
    }, 60000);

    res.status(200).json({ message: 'Reserved!', reservationId: reservation.id });

  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

// Helper function for Stock Recovery
async function expireReservation(resId, dropId, io) {
  const res = await Reservation.findByPk(resId);
  if (res && res.status === 'active') {
    res.status = 'expired';
    await res.save();

    const drop = await Drop.findByPk(dropId);
    drop.availableStock += 1;
    await drop.save();

    io.emit('stock_updated', { dropId, availableStock: drop.availableStock });
    console.log(`Reservation ${resId} expired. Stock returned.`);
  }
}


router.post('/purchase/:reservationId', async (req, res) => {
  const { reservationId } = req.params;
  const t = await sequelize.transaction();

  try {
    // 1. Find the active reservation
    const reservation = await Reservation.findByPk(reservationId, { transaction: t });

    if (!reservation || reservation.status !== 'active') {
      await t.rollback();
      return res.status(400).json({ message: 'Reservation expired or invalid.' });
    }

    // 2. Mark reservation as completed
    reservation.status = 'completed';
    await reservation.save({ transaction: t });

    // 3. Create a Purchase record (This feeds the "Activity Feed")
    await Purchase.create({
      DropId: reservation.DropId,
      // In a real app, you'd get the UserId from the auth session
      status: 'success'
    }, { transaction: t });

    await t.commit();

    // 4. Notify everyone of the final sale
    req.app.get('socketio').emit('new_purchase', {
      dropId: reservation.DropId,
      message: "A new pair of sneakers was just purchased!"
    });

    res.status(200).json({ message: 'Purchase successful!' });

  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
});


router.get('/drops', async (req, res) => {
    try {
      const drops = await Drop.findAll({
        include: [
          {
            model: Purchase,
            limit: 3,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, attributes: ['username'] }] // Only get username for privacy/security
          }
        ],
        order: [['id', 'ASC']] // Keep the list order consistent
      });
      
      res.status(200).json(drops);
    } catch (error) {
      console.error("Error fetching drops:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;