const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection status
let dbConnected = false;

// MongoDB Connection Function
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        const db = mongoose.connection;
        
        // Set up event listeners before connecting
        db.on('error', (error) => {
            console.error('MongoDB connection error:', error);
            dbConnected = false;
        });

        db.on('disconnected', () => {
            console.warn('MongoDB disconnected');
            dbConnected = false;
        });

        db.on('reconnected', () => {
            console.log('✓ MongoDB reconnected');
            dbConnected = true;
        });

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Wait for connection to be fully established
        if (db.readyState !== 1) {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Database connection timeout'));
                }, 10000); // 10 second timeout

                db.once('open', () => {
                    clearTimeout(timeout);
                    console.log('✓ Connected to MongoDB');
                    dbConnected = true;
                    resolve();
                });
                
                db.once('error', (error) => {
                    clearTimeout(timeout);
                    dbConnected = false;
                    reject(error);
                });
            });
        } else {
            // Already connected
            console.log('✓ Connected to MongoDB');
            dbConnected = true;
        }

        return true;
    } catch (error) {
        console.error('✗ Failed to connect to MongoDB:', error.message);
        dbConnected = false;
        throw error;
    }
};

// Middleware to check database connection
const checkDBConnection = (req, res, next) => {
    if (!dbConnected) {
        return res.status(503).json({
            message: 'Database connection unavailable',
            error: 'Service temporarily unavailable. Please try again later.'
        });
    }
    next();
};

// Health check endpoint (doesn't require DB)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Apply database check middleware to all routes that need it
// Auth routes don't need DB (using env vars)
app.use('/api/auth', require('./routes/auth'));
app.use(express.static("path/to/client/dist"))

// All other routes require database connection
app.use('/api/bookings', checkDBConnection, require('./routes/booking'));
app.use('/api/admin', checkDBConnection, require('./routes/admin'));
app.use('/api/timeslots', checkDBConnection, require('./routes/timeSlots'));
app.use('/api/customers', checkDBConnection, require('./routes/customers'));
app.use('/api/settings', checkDBConnection, require('./routes/settings'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.get("*", (req, res) => {
    res.sendFile(path.resolve("path/to/client/dish/index.html"))
})

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server only after database connection
const startServer = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await connectDB();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`✓ Server is running on port ${PORT}`);
            console.log(`✓ Health check available at http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error.message);
        console.error('Please check your MongoDB connection and try again.');
        process.exit(1);
    }
};

// Start the application
startServer();