const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
  audioUrl: {
    type: String,
    required: true
  },
  transcriptionText: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Changed to ObjectId
    ref: 'User', // Reference to User model
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transcription', transcriptionSchema);