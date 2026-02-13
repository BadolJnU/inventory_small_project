const jwt = require('jsonwebtoken');

// Change this to match the name you used in the route: isAdmin
const isAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // CRITICAL: Ensure 'SUPER_SECRET_KEY' is exactly what you have in authRoutes.js
    const decoded = jwt.verify(token, '12serqr4tgvsq901nqanwo');
    req.user = decoded;

    // Optional: If you want to strictly check the email for admin rights
    if (req.user.email !== 'admin@system.com') {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    res.status(401).json({ error: "Session expired or invalid token." });
  }
};

// Export as an object so { isAdmin } works in your routes
module.exports = { isAdmin };