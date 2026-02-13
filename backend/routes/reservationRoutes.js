const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/db');
const { isAdmin } = require('../middleware/authMiddleware');

// Import models
const Drop = require('../models/Drop');
const Purchase = require('../models/Purchase');
const User = require('../models/User');

/**
 * @route   GET /api/items
 * @desc    Fetch all available items for the shop
 */
router.get('/items', async (req, res) => {
  try {
    const items = await Drop.findAll({
      order: [['id', 'ASC']]
    });
    res.status(200).json(items);
  } catch (error) {
    console.error("FETCH ITEMS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

/**
 * @route   GET /api/admin/data
 * @desc    Fetch Users, Items, and Purchase History for Admin Panel
 */
router.get('/admin/data', async (req, res) => {
  try {
    const history = await Purchase.findAll({
      include: [
        {
          model: User,
          attributes: ['username']
        },
        {
          model: Drop,
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const items = await Drop.findAll();
    const users = await User.findAll();

    res.json({ users, items, history });
  } catch (error) {
    console.error("ADMIN DATA CRASH:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/reserve
 * @desc    User: Reserve specific quantity (60s lock)
 */
router.post('/reserve', async (req, res) => {
  const { itemId, userId, quantity } = req.body;
  let t;

  try {
    t = await sequelize.transaction();
    const item = await Drop.findByPk(itemId, { transaction: t, lock: t.LOCK.UPDATE });

    if (!item || item.availableStock < quantity) {
      if (t) await t.rollback();
      return res.status(400).json({ error: "Insufficient stock" });
    }

    item.availableStock -= quantity;
    await item.save({ transaction: t });

    const purchase = await Purchase.create({ 
      UserId: userId, 
      DropId: itemId, 
      quantity, 
      status: 'pending' 
    }, { transaction: t });

    await t.commit();
    t = null; 

    const io = req.app.get('socketio');
    if (io) io.emit('stock_updated', { itemId: item.id, newStock: item.availableStock });

    setTimeout(async () => {
      try {
        const checkPurchase = await Purchase.findByPk(purchase.id);
        if (checkPurchase && checkPurchase.status === 'pending') {
          const revertItem = await Drop.findByPk(itemId);
          revertItem.availableStock += quantity; 
          await revertItem.save();
          await checkPurchase.destroy(); 

          if (io) io.emit('stock_updated', { itemId: itemId, newStock: revertItem.availableStock });
          console.log(`Timer Expired: Stock for item ${itemId} returned.`);
        }
      } catch (err) {
        console.error("Timeout Release Error:", err);
      }
    }, 60000);

    res.json({ message: "Reserved for 60s", purchaseId: purchase.id });

  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/purchase-confirm
 * @desc    User: Finalize the purchase
 */
router.post('/purchase-confirm', async (req, res) => {
  try {
    const itemId = Number(req.body.itemId);
    const userId = Number(req.body.userId);

    // 1. Let's see ALL pending purchases in the terminal
    const allPending = await Purchase.findAll({ where: { status: 'pending' } });
    console.log("--- DATABASE DEBUG ---");
    console.log("Looking for Item:", itemId, "User:", userId);
    console.log("Current Pending Records in DB:", JSON.stringify(allPending, null, 2));

    // 2. Try the search
    const reservation = await Purchase.findOne({
      where: {
        DropId: itemId,   
        UserId: userId,   
        status: 'pending'
      }
    });

    if (!reservation) {
      return res.status(404).json({ 
        error: "Reservation not found",
        debug: "Check your backend terminal to see actual column names" 
      });
    }

    reservation.status = 'completed';
    await reservation.save();
    res.json({ message: "Success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET /api/my-orders/:userId
 * @desc    Fetch successful purchases for a specific user
 */
router.get('/my-orders/:userId', async (req, res) => {
  try {
    const orders = await Purchase.findAll({
      where: {
        UserId: req.params.userId,
        status: 'completed'
      },
      include: [{ model: Drop, attributes: ['name', 'price'] }],
      order: [['updatedAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch your orders" });
  }
});

module.exports = router;