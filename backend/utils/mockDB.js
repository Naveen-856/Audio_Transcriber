const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'mock-database.json');

// Initialize mock database file
const initializeDB = () => {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ users: [], transcriptions: [] }));
  }
};

// Read from mock database
const readDB = () => {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], transcriptions: [] };
  }
};

// Write to mock database
const writeDB = (data) => {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
};

// Mock DB operations
const mockDB = {
  // User operations
  users: {
    findOne: async (query) => {
      const db = readDB();
      return db.users.find(user => 
        (query.email && user.email === query.email) ||
        (query.username && user.username === query.username) ||
        (query._id && user._id === query._id)
      );
    },
    
    create: async (userData) => {
      const db = readDB();
      const user = {
        _id: Date.now().toString(),
        ...userData,
        createdAt: new Date()
      };
      db.users.push(user);
      writeDB(db);
      return user;
    }
  },

  // Transcription operations
  transcriptions: {
    find: async (query = {}) => {
      const db = readDB();
      let transcriptions = db.transcriptions;
      
      // Sort by createdAt descending
      transcriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Limit results
      if (query.limit) {
        transcriptions = transcriptions.slice(0, query.limit);
      }
      
      return transcriptions;
    },
    
    create: async (transcriptionData) => {
      const db = readDB();
      const transcription = {
        _id: Date.now().toString(),
        ...transcriptionData,
        createdAt: new Date()
      };
      db.transcriptions.push(transcription);
      writeDB(db);
      return transcription;
    }
  }
};

// Initialize on import
initializeDB();

module.exports = mockDB;