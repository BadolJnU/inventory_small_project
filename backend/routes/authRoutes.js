const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = '12serqr4tgvsq901nqanwo'; // In production, use .env

// REGISTER
// Register Route
router.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if fields are missing
      if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password: hashedPassword });
      
      res.status(201).json({ message: "User registered!" });
    } catch (err) {
      console.error(err); // This will show you the EXACT error in the terminal
      res.status(400).json({ error: "Registration failed" });
    }
  });

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create Token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;