🎤 Speech-to-text (Audio Transcriber)

A beautiful, full-stack web application that converts audio files to text using AI-powered speech recognition. Features a modern glass-morphism UI, user authentication, and real-time audio processing.

https://img.shields.io/badge/React-18.2.0-blue https://img.shields.io/badge/Express-4.18.2-green https://img.shields.io/badge/MongoDB-7.5.0-green https://img.shields.io/badge/JWT-Authentication-orange

✨ Live Demo

🎯 Experience the live application: https://teal-lolly-371105.netlify.app/

🎥 Features

🎵 Core Functionality

· Audio File Upload - Drag & drop or file browser with beautiful UI
· Live Audio Recording - Direct microphone recording with real-time preview
· AI-Powered Transcription - Using AssemblyAI's advanced speech-to-text API
· Real-time Processing - Live status updates during transcription

👤 User Experience

· User Authentication - Secure JWT-based login/registration
· Persistent History - Save and manage all your transcriptions
· Clear History - One-click history management with confirmation
· Responsive Design - Perfect experience on all devices

🎨 Premium UI/UX

· Glass Morphism Design - Modern translucent glass effects
· Smooth Animations - CSS transitions and micro-interactions
· Drag & Drop Interface - Intuitive file handling
· Loading States - Beautiful spinners and progress indicators
· Error Handling - User-friendly error messages and validation

🛠 Tech Stack

Frontend

· React 18 - Modern UI framework with hooks
· Vite - Fast build tool and development server
· Tailwind CSS - Utility-first CSS framework
· Custom Animations - CSS keyframes and transitions

Backend

· Node.js - Runtime environment
· Express.js - Web application framework
· MongoDB - Database with Mongoose ODM
· JWT - JSON Web Tokens for authentication
· bcryptjs - Password hashing security

APIs & Services

· AssemblyAI - Speech-to-text AI API
· Multer - File upload middleware
· CORS - Cross-origin resource sharing

🚀 Quick Start

Prerequisites

· Node.js (v18 or higher)
· MongoDB (optional - app works with mock data)
· AssemblyAI API key

Installation

1. Clone the repository

bash
git clone https://github.com/Naveen-856/Audio_Transcriber.git
cd Audio_Transcriber


1. Backend Setup

bash
cd backend
npm install

# Environment setup
cp .env.example .env
# NODE_ENV=production
# PORT=10000
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_super_secure_jwt_secret_production
# ASSEMBLYAI_API_KEY=your_assemblyai_api_key

npm run dev


1. Frontend Setup

bash
cd frontend
npm install
npm run dev


1. Access the application

· Frontend: http://localhost:5173
· Backend: http://localhost:5000

🔧 Environment Variables

Backend (.env)

env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secure_jwt_secret
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
PORT=5000
NODE_ENV=development


Frontend (.env.production)

env
VITE_API_URL=https://your-backend-url.onrender.com


📁 Project Structure

audio-transcriber/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/        # Login & Registration
│   │   │   └── History/     # History management
│   │   ├── App.jsx          # Main application component
│   │   └── App.css          # Styles and animations
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Express server
│   ├── models/              # MongoDB models
│   │   ├── User.js
│   │   └── Transcription.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   └── transcribe.js
│   ├── middleware/          # Authentication
│   ├── index.js             # Server entry point
│   └── package.json
└── README.md


🎯 API Endpoints

Authentication

· POST /api/auth/register - User registration
· POST /api/auth/login - User login
· GET /api/auth/me - Get current user

Transcription

· POST /api/transcribe - Transcribe audio file/recording
· GET /api/transcriptions - Get user's transcription history
· DELETE /api/transcribe/history - Clear all history

Health Check

· GET / - Backend status
· GET /api/health - Detailed health check

🎨 UI/UX Features

Design System

· Glass Morphism - Translucent backgrounds with blur effects
· Gradient Backgrounds - Beautiful color transitions
· Smooth Animations - Hover effects and page transitions
· Micro-interactions - Button presses, loading states, success feedback

Responsive Design

· Mobile-First - Optimized for mobile devices
· Tablet Support - Adaptive layouts for tablets
· Desktop Enhancement - Additional features on larger screens

🔒 Security Features

· JWT token-based authentication
· Password hashing with bcryptjs
· CORS configuration for production
· Input validation and sanitization
· File type and size validation
· Environment variable protection

🚀 Deployment

The application is configured for production deployment:

Backend (Render)

· URL: https://audio-transcriber-backend-i86z.onrender.com
· Environment: Node.js
· Auto-deploy: On Git push to main

Frontend (Netlify)

· URL: https://teal-lolly-371105.netlify.app/
· Framework: React
· Auto-deploy: On Git push to main

📊 Development Journey

🎯 Project Timeline (14-Day Internship)

Week 1: Core Foundation

· Day 1-2: Project setup, React + Express foundation
· Day 3-4: Database design, API integration
· Day 5-7: Core features, frontend-backend connection

Week 2: Enhancement & Deployment

· Day 8-9: UI/UX polish, error handling
· Day 10: Authentication system
· Day 11-12: Production deployment
· Day 13-14: Testing, documentation, final touches

🏆 Key Achievements

· ✅ Full-stack application development
· ✅ AI API integration (AssemblyAI)
· ✅ User authentication system
· ✅ Professional UI/UX design
· ✅ Production deployment
· ✅ Comprehensive documentation

🤝 Contributing

We welcome contributions! Please feel free to submit issues and enhancement requests.

1. Fork the repository
2. Create a feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

👨‍💻 Author

Naveen Kumar

· GitHub: @Naveen-856
· Project: Audio Transcriber

🙏 Acknowledgments

· AssemblyAI for their excellent speech-to-text API
· Tailwind CSS for the amazing utility framework
· React Team for the incredible framework
· Vite for the fast development experience
· Render & Netlify for seamless deployment

---

🎊 Project Status

✅ COMPLETED - All features implemented and deployed successfully!

Live Demo: https://teal-lolly-371105.netlify.app/
Backend API:https://audio-transcriber-backend-i86z.onrender.com

---

⭐ If you find this project helpful, please give it a star on GitHub!










env
VITE_API_URL= (https://audio-transcriber-backend-i86z.onrender.com)
