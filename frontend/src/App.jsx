import { useState, useEffect, useRef } from 'react'
import Login from './components/Auth/Login.jsx'
import Register from './components/Auth/Register.jsx'
import HistoryList from './components/History/HistoryList.jsx'

function App() {
  const [currentView, setCurrentView] = useState('login')
  const [user, setUser] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [loading, setLoading] = useState(false)
  const [transcriptionsHistory, setTranscriptionsHistory] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState('')
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setCurrentView('main')
      fetchTranscriptionHistory()
    }
  }, [])

  // Fetch transcription history
  const fetchTranscriptionHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/transcriptions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTranscriptionsHistory(data.transcriptions)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioURL(audioUrl)
        
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' })
        handleFileUpload(audioFile)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      setTranscription('❌ Microphone access denied. Please allow microphone permissions to record audio.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return

    setLoading(true)
    setTranscription('')
    
    try {
      const formData = new FormData()
      formData.append('audio', file)

      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/transcribe', {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token} `} : {}
      })

      if (!response.ok) {
        throw new Error('Backend response was not ok')
      }

      const data = await response.json()
      
      if (data.success) {
        setTranscription(data.transcription)
        fetchTranscriptionHistory()
      } else {
        throw new Error(data.error || 'Transcription failed')
      }
      
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = `Error: ${error.message}`;
      
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage = '❌ Cannot connect to the server. Please make sure the backend is running on port 5000.';
      } else if (error.message.includes('API key') || error.message.includes('unavailable')) {
        errorMessage = '🔧 Speech-to-Text service is temporarily unavailable. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '⏰ Audio is too long. Please try with a shorter file (under 5 minutes).';
      } else if (error.message.includes('File too large')) {
        errorMessage = '📁 File is too large. Maximum size is 25MB.';
      } else if (error.message.includes('Invalid file type')) {
        errorMessage = '🎵 Invalid file type. Please upload MP3, WAV, M4A, or other audio files.';
      }
      
      setTranscription(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCurrentView('login')
    setTranscriptionsHistory([])
  }

  // Add this function to your App component
const handleClearHistory = async () => {
  if (window.confirm('Are you sure you want to clear all transcription history? This action cannot be undone.')) {
    try {
      const token = localStorage.getItem('token');
      // Clear frontend state immediately for better UX
      setTranscriptionsHistory([]);
      
      // Try to clear backend history
      if (token) {
        await fetch('http://localhost:5000/api/transcribe/history', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Show success message
      setTranscription('🗑 History cleared successfully!');
      setTimeout(() => {
        if (!transcription.includes('Error:') && !transcription.includes('❌')) {
          setTranscription('');
        }
      }, 3000);
    } catch (error) {
      console.error('Error clearing history:', error);
      // Even if backend fails, frontend is cleared
      setTranscription('🗑 Local history cleared!');
      setTimeout(() => setTranscription(''), 3000);
    }
  }
};

  // Render different views
  if (currentView === 'login') {
    return (
      <Login 
        onLogin={(userData) => {
          setUser(userData)
          setCurrentView('main')
          fetchTranscriptionHistory()
        }}
        onSwitchToRegister={() => setCurrentView('register')}
      />
    )
  }

  if (currentView === 'register') {
    return (
      <Register 
        onRegister={(userData) => {
          setUser(userData)
          setCurrentView('main')
          fetchTranscriptionHistory()
        }}
        onSwitchToLogin={() => setCurrentView('login')}
      />
    )
  }

  // Main app view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header with User Info */}
      <div className="flex justify-between items-center mb-12 bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Audio Transcriber
            </h1>
            <p className="text-lg text-gray-600 mt-1 flex items-center">
              Welcome back, <span className="font-semibold text-purple-600 ml-1">{user?.username}</span>
              <span className="mx-2">•</span>
              <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">Active</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden md:block">
            <p className="text-sm text-gray-500">Signed in as</p>
            <p className="text-gray-700 font-medium">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-200 flex items-center space-x-2 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          {/* Enhanced Drag & Drop Upload Area */}
<div 
  className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500 cursor-pointer mb-8 relative overflow-hidden group ${
    dragActive 
      ? 'border-blue-400 bg-blue-50 scale-[1.02] shadow-2xl' 
      : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50 shadow-lg hover:shadow-2xl'
  } ${loading || isRecording ? 'opacity-50 pointer-events-none' : ''} hover-lift`}
  onDragEnter={handleDrag}
  onDragLeave={handleDrag}
  onDragOver={handleDrag}
  onDrop={handleDrop}
  onClick={() => document.getElementById('file-input').click()}
>
  {/* Animated background */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  
  {/* Floating particles */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
    <div className="absolute top-4 left-10 w-2 h-2 bg-blue-400 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
    <div className="absolute top-10 right-16 w-1 h-1 bg-purple-400 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
    <div className="absolute bottom-8 left-16 w-1 h-1 bg-indigo-400 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
  </div>

  <div className="relative z-10 max-w-md mx-auto">
    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl animate-pulse-glow group-hover:scale-110 transition-transform duration-300">
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-3">
      {dragActive ? '🎉 Drop to Upload!' : 'Upload Audio File'}
    </h3>
    <p className="text-gray-600 mb-6 text-lg">
      {dragActive ? 'Release to transcribe your audio' : 'Drag & drop or click to browse files'}
    </p>
    <div className="flex items-center justify-center space-x-3 text-sm">
      <span className="bg-white/80 px-3 py-1 rounded-full border border-gray-200 text-gray-600 shadow-sm">MP3</span>
      <span className="bg-white/80 px-3 py-1 rounded-full border border-gray-200 text-gray-600 shadow-sm">WAV</span>
      <span className="bg-white/80 px-3 py-1 rounded-full border border-gray-200 text-gray-600 shadow-sm">M4A</span>
      <span className="bg-white/80 px-3 py-1 rounded-full border border-gray-200 text-gray-600 shadow-sm">+More</span>
    </div>
    <div className="mt-6">
      <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto group-hover:w-40 transition-all duration-500"></div>
    </div>
  </div>
  <input
    id="file-input"
    type="file"
    accept="audio/*"
    onChange={handleChange}
    className="hidden"
    disabled={loading || isRecording}
  />
</div>

          {/* Record Audio Button */}
          <div className="mb-8">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700' 
                  : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
              }`}
              disabled={loading}
            >
              <div className="flex items-center justify-center space-x-3">
                {isRecording ? (
                  <>
                    <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
                    <span>⏹ Stop Recording ({formatTime(recordingTime)})</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                    <span>🎤 Start Recording</span>
                  </>
                )}
              </div>
            </button>
            {audioURL && !isRecording && (
              <div className="mt-4 text-center">
                <audio controls src={audioURL} className="mx-auto">
                  Your browser does not support the audio element.
                </audio>
                <p className="text-sm text-gray-600 mt-2">Last recording preview</p>
              </div>
            )}
          </div>

          {/* Loading Animation */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-blue-500 rounded-full animate-ping"></div>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">Processing your audio...</p>
                  <p className="text-gray-500">This may take 10-30 seconds</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Transcription Result */}
          {transcription && !loading && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-lg transform transition-all duration-500 animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-green-800">Transcription Complete</h3>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">{transcription}</p>
              </div>
            </div>
          )}
        </div>

        {/* History Component */}
        <HistoryList transcriptions={transcriptionsHistory} onClearHistory={handleClearHistory}/>
      </div>
    </div>
  )
}

export default App