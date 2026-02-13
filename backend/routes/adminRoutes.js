const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Drop = require('../models/Drop');
const Purchase = require('../models/Purchase');
const { isAdmin } = require('../middleware/authMiddleware');

// Only the admin can delete items
router.delete('/items/:id', isAdmin, async (req, res) => {
    await Drop.destroy({ where: { id: req.params.id } });
    res.json({ message: "Item deleted by admin" });
  });
  
  // Only the admin can see the full user list
  router.get('/data', authenticateToken, (req, res) => {
    // Only runs if token is valid
    res.json({ message: "Welcome to the hidden admin cave!" });
  });
module.exports = router;