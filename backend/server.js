const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');

const app = express();
const server = http.createServer(app); 

// UPDATED: Origin set to 5174 to match your Vite port
const allowedOrigin = 'http://localhost:5173'; 

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  }
});

// Import Routes & Models
const reservationRoutes = require('./routes/reservationRoutes');
const authRoutes = require('./routes/authRoutes'); // Imported here
const Drop = require('./models/Drop');
const Reservation = require('./models/Reservation');
const Purchase = require('./models/Purchase');
const User = require('./models/User');

// Setup Associations
Drop.hasMany(Reservation);
Reservation.belongsTo(Drop);
Drop.hasMany(Purchase);
Purchase.belongsTo(Drop);
User.hasMany(Purchase);
Purchase.belongsTo(User);

app.set('socketio', io);

// Routes
app.use('/api', reservationRoutes);
app.use('/api/auth', authRoutes); // Auth routes now correctly mapped

// Database Sync & Seed
connectDB();
// Change force to true ONLY ONCE if you want to wipe the "automatic" users
sequelize.sync({ force: true }).then(async () => {
    const dropCount = await Drop.count();
    if (dropCount === 0) {
      await Drop.create({ name: "Air Jordan 2 High", price: 270, availableStock: 20 });
      console.log("✅ Seed data (Drops) created! NO USERS CREATED.");
    }
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});