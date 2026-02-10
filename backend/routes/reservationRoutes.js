const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const Drop = require('../models/Drop');
const Reservation = require('../models/Reservation');

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

module.exports = router;