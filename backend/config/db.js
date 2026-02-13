const { Sequelize } = require('sequelize');
const pg = require('pg');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg, // Tells Vercel to include the pg package
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Successfully connected to Neon PostgreSQL!');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

module.exports = { sequelize, connectDB };