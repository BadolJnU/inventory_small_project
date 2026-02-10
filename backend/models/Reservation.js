const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Reservation = sequelize.define('Reservation', {
  status: {
    type: DataTypes.ENUM('active', 'completed', 'expired'),
    defaultValue: 'active'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

module.exports = Reservation;