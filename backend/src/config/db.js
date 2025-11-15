const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  console.log('[DB] MONGO_URI:', uri ? 'Set' : 'NOT SET');
  if (!uri) {
    console.error('MONGO_URI not set in environment');
    return;
  }
  try {
    console.log('[DB] Attempting to connect to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    console.log('[DB] Connection state:', mongoose.connection.readyState);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('[DB] Full error:', err);
    // Don't exit, just log the error
  }
};

module.exports = connectDB;
