const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('[DB] MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
  console.log('[DB] MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'NOT SET');
  if (!uri) {
    console.error('Neither MONGODB_URI nor MONGO_URI set in environment');
    return;
  }
  try {
    console.log('[DB] Attempting to connect to MongoDB...');
    console.log('[DB] Using URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[password]@'));
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      maxPoolSize: 10,
    });
    console.log('✅ MongoDB connected successfully');
    console.log('[DB] Connection state:', mongoose.connection.readyState);
    console.log('[DB] Database name:', mongoose.connection.name);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('[DB] Full error:', err);
    console.error('[DB] Connection failed - server will continue without database');
    // Don't exit, just log the error
  }
};

module.exports = connectDB;
