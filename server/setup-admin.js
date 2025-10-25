const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty-booking', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            password: 'admin123', // Change this to a secure password
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Please change the password after first login.');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

createAdminUser();
