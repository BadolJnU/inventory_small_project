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
Drop.hasMany(Reservation);
Reservation.belongsTo(Drop);


app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Sync Database (Force: false ensures we don't delete data on every restart)
sequelize.sync({ force: false }).then(async () => {
    const count = await Drop.count();
    if (count === 0) {
      await Drop.create({ name: "Air Jordan 1 High", price: 170, availableStock: 10 });
      console.log("Seed data created!");
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