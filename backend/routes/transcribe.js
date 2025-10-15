const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Transcription = require('../models/Transcription');
const router = express.Router();

// Mock storage for transcriptions (fallback)
let mockTranscriptions = [];

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 
      'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/webm'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM`), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 25MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  next();
};

// Validate audio file before processing
const validateAudioFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No audio file provided. Please select an audio file.'
    });
  }

  if (req.file.size === 0) {
    return res.status(400).json({
      success: false,
      error: 'Audio file is empty. Please select a valid audio file.'
    });
  }

  if (!process.env.ASSEMBLYAI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error: Speech-to-Text service is not configured.'
    });
  }

  next();
};

// POST route to handle audio transcription
router.post('/', upload.single('audio'), handleMulterError, validateAudioFile, async (req, res) => {
  let transcriptionText = '';
  
  try {
    console.log('Starting AssemblyAI transcription for:', req.file.originalname);
    console.log('File size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');

    // Step 1: Upload audio to AssemblyAI
    console.log('Uploading audio to AssemblyAI...');
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY,
      },
      body: req.file.buffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`AssemblyAI upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;
    console.log('✅ Audio uploaded to AssemblyAI');

    // Step 2: Request transcription
    console.log('Requesting transcription...');
    const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_detection: true
      })
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      throw new Error(`Transcription request failed: ${transcriptionResponse.status} - ${errorText}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcriptId = transcriptionData.id;
    console.log('✅ Transcription requested. ID:', transcriptId);

    // Step 3: Poll for results with timeout
    console.log('Waiting for transcription to complete...');
    const maxWaitTime = 120000; // 2 minutes max
    const startTime = Date.now();
    let isCompleted = false;

    while (!isCompleted && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.ASSEMBLYAI_API_KEY,
        },
      });

      if (!pollResponse.ok) {
        throw new Error(`Polling failed: ${pollResponse.statusText}`);
      }

      const result = await pollResponse.json();
      console.log('Transcription status:', result.status);

      if (result.status === 'completed') {
        transcriptionText = result.text || 'No speech detected in audio.';
        console.log('✅ Transcription completed!');
        isCompleted = true;
      } else if (result.status === 'error') {
        throw new Error(`Transcription failed: ${result.error}`);
      }
    }

    if (!isCompleted) {
      throw new Error('Transcription timeout: Processing took too long. Please try again with a shorter audio file.');
    }

    // Save transcription to database (MongoDB or mock)
    try {
      // Try MongoDB first
      if (mongoose.connection.readyState === 1) {
        const newTranscription = new Transcription({
          audioUrl: `uploaded_${Date.now()}_${req.file.originalname}`,
          transcriptionText: transcriptionText,
          userId: req.user ? req.user.id : null
        });
        
        await newTranscription.save();
        console.log('✅ Transcription saved to MongoDB');
      } else {
        // Fallback to mock storage
        const mockTranscription = {
          _id: Date.now().toString(),
          audioUrl: `uploaded_${Date.now()}_${req.file.originalname}`,
          transcriptionText: transcriptionText,
          userId: req.user ? req.user.id : null,
          createdAt: new Date()
        };
        mockTranscriptions.unshift(mockTranscription); // Add to beginning
        // Keep only last 50 transcriptions
        if (mockTranscriptions.length > 50) {
          mockTranscriptions = mockTranscriptions.slice(0, 50);
        }
        console.log('✅ Transcription saved to mock storage');
      }
    } catch (dbError) {
      console.log('⚠ Could not save transcription:', dbError.message);
    }
    
    res.json({ 
      success: true, 
      transcription: transcriptionText 
    });

  } catch (error) {
    console.error('❌ Transcription Error:', error.message);
    
    // Specific error handling
    let userMessage = error.message;
    if (error.message.includes('401') || error.message.includes('API key')) {
      userMessage = 'Speech-to-Text service is temporarily unavailable. Please try again later.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Audio processing took too long. Please try a shorter audio file (under 2 minutes).';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your internet connection and try again.';
    }

    res.status(500).json({ 
      success: false, 
      error: userMessage 
    });
  }
});

// Get transcriptions route
router.get('/history', async (req, res) => {
  try {
    let transcriptions = [];
    
    // Try MongoDB first
    if (mongoose.connection.readyState === 1) {
      const Transcription = require('../models/Transcription');
      transcriptions = await Transcription.find()
        .sort({ createdAt: -1 })
        .limit(10);
    } else {
      // Fallback to mock storage
      transcriptions = mockTranscriptions.slice(0, 10);
    }
    
    res.json({ 
      success: true, 
      transcriptions 
    });
    
  } catch (error) {
    console.error('Error fetching transcriptions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch transcriptions' 
    });
  }
});

// Clear history route
router.delete('/history', async (req, res) => {
  try {
    // For MongoDB
    if (mongoose.connection.readyState === 1) {
      await Transcription.deleteMany({});
      console.log('✅ MongoDB history cleared');
    } else {
      // For mock storage
      mockTranscriptions = [];
      console.log('✅ Mock history cleared');
    }
    
    res.json({ 
      success: true, 
      message: 'History cleared successfully' 
    });
    
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear history' 
    });
  }
});

module.exports = router;