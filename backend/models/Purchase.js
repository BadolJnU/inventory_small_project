const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'success'
  }

});

module.exports = Purchase;