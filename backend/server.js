const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectDB, sequelize } = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // In production, limit this to your frontend URL
});
const reservationRoutes = require('./routes/reservationRoutes');

// Middleware
app.set('socketio', io); // Make Socket.io instance available in routes
app.use('/api', reservationRoutes);

const Drop = require('./models/Drop');
const Reservation = require('./models/Reservation');
const Purchase = require('./models/Purchase');
const User = require('./models/User');

Drop.hasMany(Reservation);
Reservation.belongsTo(Drop);

Drop.hasMany(Purchase);
Purchase.belongsTo(Drop);

// One User can have many Purchases
User.hasMany(Purchase);
Purchase.belongsTo(User);



app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

sequelize.sync({ force: false }).then(async () => {
    const dropCount = await Drop.count();
    if (dropCount === 0) {
      await Drop.create({ name: "Air Jordan 2 High", price: 270, availableStock: 20 });
      // Create a dummy user for testing
      await User.create({ username: "SneakerHead99", email: "test@example.com" });
      console.log("Seed data (Drop & User) created!");
    }
  });
// Real-time connection logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});