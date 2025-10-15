require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...');
console.log('Connection String:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//USERNAME:PASSWORD@'));

const testConnection = async () => {
  try {
    // Test with shorter timeout
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ SUCCESS: Connected to MongoDB!');
    
    // Test basic operations
    const Test = mongoose.model('Test', new mongoose.Schema({ name: String }));
    await Test.create({ name: 'test' });
    console.log('✅ SUCCESS: Can write to database!');
    
    process.exit(0);
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('💡 TIPS:');
    console.log('1. Check if your MongoDB cluster is active in Atlas dashboard');
    console.log('2. Check Network Access - allow all IPs (0.0.0.0/0)');
    console.log('3. Verify username/password in connection string');
    process.exit(1);
  }
};

testConnection();