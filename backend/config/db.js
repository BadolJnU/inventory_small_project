const { Sequelize } = require('sequelize');
const pg = require('pg'); // 1. Import pg directly
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    dialectModule: pg, // 2. Tell Sequelize to use the pg package you installed
    logging: false,
    dialectOptions: {
      ssl: {
        require: true, 
        rejectUnauthorized: false // 3. Required for Neon connection
      }
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
    // On Vercel, don't use process.exit(1) as it kills the serverless function
  }
};

module.exports = { sequelize, connectDB };