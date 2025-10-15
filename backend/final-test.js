require('dotenv').config();
console.log('Connection string:', process.env.MONGODB_URI ? '✅ Found' : '❌ Missing');
console.log('Testing basic Node.js... ✅ Working!');