require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ SUCCESS: Connected to MongoDB!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  });