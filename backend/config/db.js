const { Sequelize } = require('sequelize');
const pg = require('pg'); // <--- ADD THIS LINE
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    dialectModule: pg, // <--- ADD THIS LINE (This is the "magic" fix for Vercel)
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required for Neon
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected Successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // Removed process.exit(1) so the Vercel function doesn't hard-crash
  }
};

module.exports = { sequelize, connectDB };