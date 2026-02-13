const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await sequelize.sync(); // Ensure table exists
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    
    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@system.com' },
      defaults: {
        username: 'SystemAdmin',
        password: hashedAdminPassword,
      }
    });

    if (created) {
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdmin();