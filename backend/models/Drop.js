const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Drop = sequelize.define('Drop', {
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  availableStock: { type: DataTypes.INTEGER, defaultValue: 0 },
  category: { 
    type: DataTypes.ENUM('Shoes', 'Clothes', 'Accessories'), 
    allowNull: false 
  }
});

module.exports = Drop;