const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. REGISTRATION ROUTE
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Add this log to see what the frontend is actually sending
    console.log("Registering:", { username, email, password });

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({ 
      username, 
      email, 
      password: hashedPassword 
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("DETAILED REGISTRATION ERROR:", err); // Check terminal for this!
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});
// 2. LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // THE TOKEN LOGIC MUST BE INSIDE THIS FUNCTION
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      '12serqr4tgvsq901nqanwo', 
      { expiresIn: '1h' }
    );

    res.json({ 
      token, 
      email: user.email, 
      username: user.username,
      userId: user.id 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;