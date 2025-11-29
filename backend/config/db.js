// backend/config/db.js
import mongoose from 'mongoose';
import CustomError from '../errorHandler/CustomError.js';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) {
      throw new CustomError(
        'DatabaseConnectionError',
        'MONGODB_URI environment variable is not defined',
        500
      );
    }

    await mongoose.connect(MONGO_URI, {
      minPoolSize: 5,
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      writeConcern: { w: 'majority' },
      retryWrites: true,
    });
  } catch (error) {
    console.error(`❌ Initial MongoDB connection error: ${error.message}`);
    // Allow the application to attempt to connect in the background
    process.exit(1); // Exit on initial connection failure
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected successfully.');
  } catch (error) {
    console.error(`❌ MongoDB disconnection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('connecting', () => {
  console.log('Attempting to connect to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('💾 Connected to MongoDB successfully.');
});

mongoose.connection.on('disconnected', () => {
  console.warn('🔌 MongoDB connection lost. Mongoose will attempt to reconnect automatically.');
});

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err.message);
});

export { connectDB, disconnectDB };