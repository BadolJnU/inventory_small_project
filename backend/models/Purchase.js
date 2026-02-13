const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 1 
  },
  status: { 
    type: DataTypes.STRING, 
    defaultValue: 'completed' // or 'pending' if you add a payment step later
  }
});

module.exports = Purchase;