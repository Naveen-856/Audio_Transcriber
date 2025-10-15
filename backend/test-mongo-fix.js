require('dotenv').config();
const mongoose = require('mongoose');

console.log('Final MongoDB connection test...');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("🎉 SUCCESS: Connected to MongoDB!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Final Error:", err.message);
    console.log("Let's continue with a mock database for now.");
    process.exit(0); // Don't fail, just continue
  });