const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Drop = sequelize.define('Drop', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  availableStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 } // Database level check
  }
});

module.exports = Drop;