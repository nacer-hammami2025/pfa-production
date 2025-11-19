const mongoose = require('mongoose');

// Test script to verify user preferences functionality
async function testUserPreferences() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect('mongodb://localhost:27017/pfa', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const User = require('./src/models/User');

    // Create a test user with preferences
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      preferences: {
        theme: 'dark',
        language: 'fr',
        autoSave: true,
        notifications: {
          email: true,
          push: false
        }
      }
    });

    await testUser.save();
    console.log('✅ Test user created with preferences');

    // Test updating preferences
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      {
        'preferences.theme': 'light',
        'preferences.autoSave': false
      },
      { new: true }
    );

    console.log('✅ Preferences updated successfully');
    console.log('Updated preferences:', updatedUser.preferences);

    // Clean up
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test user deleted');

    await mongoose.disconnect();
    console.log('✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testUserPreferences();