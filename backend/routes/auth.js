const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Mock user storage (fallback when MongoDB fails)
let mockUsers = [];
let userIdCounter = 1;

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Mock user functions (fallback)
const findUserByEmail = async (email) => {
  return mockUsers.find(user => user.email === email);
};

const findUserByUsername = async (username) => {
  return mockUsers.find(user => user.username === username);
};

const createMockUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const user = {
    id: userIdCounter++,
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    createdAt: new Date()
  };
  mockUsers.push(user);
  return user;
};

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    let existingUser;
    
    // Try MongoDB first, then fallback to mock
    try {
      const User = require('../models/User');
      existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });
    } catch (dbError) {
      // MongoDB failed, use mock
      existingUser = await findUserByEmail(email) || await findUserByUsername(username);
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or username'
      });
    }

    let user;
    
    // Try MongoDB first, then fallback to mock
    try {
      const User = require('../models/User');
      const hashedPassword = await bcrypt.hash(password, 12);
      user = new User({ username, email, password: hashedPassword });
      await user.save();
    } catch (dbError) {
      // MongoDB failed, use mock
      user = await createMockUser({ username, email, password });
    }

    // Generate token
    const token = generateToken(user._id || user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed: ' + error.message
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    let user;
    let isMockUser = false;
    
    // Try MongoDB first, then fallback to mock
    try {
      const User = require('../models/User');
      user = await User.findOne({ email });
    } catch (dbError) {
      // MongoDB failed, use mock
      user = await findUserByEmail(email);
      isMockUser = true;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    let isPasswordValid;
    if (isMockUser) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = await user.comparePassword(password);
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id || user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed: ' + error.message
    });
  }
});

// Get current user route
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    
    // Try MongoDB first, then fallback to mock
    try {
      const User = require('../models/User');
      user = await User.findById(decoded.userId).select('-password');
    } catch (dbError) {
      // MongoDB failed, use mock
      user = mockUsers.find(u => u.id === decoded.userId);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

module.exports = router;