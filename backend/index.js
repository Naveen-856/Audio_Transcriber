const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Import routes
const transcribeRoutes = require('./routes/transcribe');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with better timeout handling
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/audio-transcriber";
let isMongoConnected = false;

console.log('🔗 Attempting MongoDB connection...');

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log("✅ Connected to MongoDB successfully!");
  isMongoConnected = true;
})
.catch(err => {
  console.log("❌ MongoDB connection failed:", err.message);
  console.log("💡 Using mock database instead");
  isMongoConnected = false;
});

// Routes
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/auth', authRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from Express backend!',
    database: isMongoConnected ? 'Connected' : 'Mock Mode',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    database: isMongoConnected ? 'Connected' : 'Mock Mode',
    timestamp: new Date().toISOString()
  });
});

// Get transcription history
app.get('/api/transcriptions', async (req, res) => {
  try {
    // This will use the mock storage from transcribe.js
    const response = await fetch(`http://localhost:${port}/api/transcribe/history`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching transcriptions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch transcriptions',
      transcriptions: [] 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running on port: ${port}`);
  console.log(`📊 Database: ${isMongoConnected ? 'Connected' : 'Mock Mode'}`);
});