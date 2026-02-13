const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');

const app = express();
const server = http.createServer(app); 

// Frontend URL - Ensure this matches your Vite port (usually 5173 or 5174)
const allowedOrigin = 'http://localhost:5173'; 

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  }
});

// Import Routes
const reservationRoutes = require('./routes/reservationRoutes');
const authRoutes = require('./routes/authRoutes');

// Import Models
const Drop = require('./models/Drop');
const Reservation = require('./models/Reservation');
const Purchase = require('./models/Purchase');
const User = require('./models/User');

// ==========================================
// SETUP ASSOCIATIONS (CRITICAL FOR ADMIN DATA)
// ==========================================

// Link User to Purchase 
// Using 'UserId' to match your reservationRoutes.js logic
User.hasMany(Purchase, { foreignKey: 'UserId' });
Purchase.belongsTo(User, { foreignKey: 'UserId' });

// Link Drop (Item) to Purchase
// Using 'DropId' to match your reservationRoutes.js logic
Drop.hasMany(Purchase, { foreignKey: 'DropId' });
Purchase.belongsTo(Drop, { foreignKey: 'DropId' });

// Legacy Reservation Associations (if still in use)
Drop.hasMany(Reservation);
Reservation.belongsTo(Drop);

// Pass socket.io to routes
app.set('socketio', io);

// ==========================================
// ROUTES
// ==========================================
app.use('/api', reservationRoutes); // Handles /api/items, /api/reserve, /api/purchase-confirm
app.use('/api/auth', authRoutes);   // Handles /api/auth/login, /api/auth/register

// ==========================================
// DATABASE SYNC
// ==========================================
connectDB();

// NOTE: Use { force: true } ONCE if you need to reset the table columns 
// to match the new UserId/DropId capitalization. Change back to { alter: true } after.
sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('✅ Database synced successfully');
  })
  .catch(err => {
    console.error('❌ Database sync failed:', err);
  });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});