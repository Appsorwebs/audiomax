# AudioMax - Setup Guide

## 🚀 Quick Start

AudioMax is now configured as a production-ready application with a secure backend server managing your Gemini API key.

### Prerequisites

- Node.js (v18 or higher)
- A Gemini API key from [Google AI Studio](https://ai.google.dev/)

### Installation Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure your API key**
   
   Edit the `.env` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

   To get a free Gemini API key:
   - Go to [https://ai.google.dev/](https://ai.google.dev/)
   - Sign in with your Google account
   - Click "Get API Key" 
   - Create a new API key
   - Copy and paste it into your `.env` file

3. **Start the application**

   You have two options:

   **Option A: Run both frontend and backend together (recommended)**
   ```bash
   npm run dev:full
   ```

   **Option B: Run frontend and backend separately**
   
   Terminal 1 (Backend):
   ```bash
   npm run server
   ```
   
   Terminal 2 (Frontend):
   ```bash
   npm run dev
   ```

4. **Open the app**
   
   Navigate to [http://localhost:5173](http://localhost:5173) in your browser

## 📁 Project Structure

```
audiomax/
├── server/              # Backend API server
│   └── index.js        # Express server with Gemini API integration
├── services/           
│   ├── backendService.ts    # Frontend service for API calls
│   ├── geminiService.ts     # Audio processing logic
│   └── ...
├── .env                # Environment variables (API key)
├── .env.example        # Template for environment variables
└── package.json        # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start frontend development server only
- `npm run server` - Start backend API server only
- `npm run dev:full` - Start both frontend and backend together
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔐 Security Notes

- **Never commit your `.env` file** - It's already in `.gitignore`
- Your API key is stored securely on the backend server
- The frontend communicates with the backend via secure API endpoints
- No API keys are exposed in the browser or client-side code

## 🛠️ How It Works

### Backend Server (Port 3001)
- Manages your Gemini API key securely
- Provides API endpoints for:
  - `/api/transcribe` - Audio transcription
  - `/api/generate-summary` - Meeting summary generation
  - `/api/translate-summary` - Summary translation
  - `/api/health` - Health check

### Frontend (Port 5173)
- React application built with Vite
- Sends audio files to backend for processing
- Displays transcriptions and summaries
- No direct API key access

## 🌐 Production Deployment

For production deployment:

1. Set environment variables on your hosting platform:
   ```
   GEMINI_API_KEY=your_production_api_key
   PORT=3001
   FRONTEND_URL=https://your-domain.com
   ```

2. Build the frontend:
   ```bash
   npm run build
   ```

3. Deploy backend server (server/index.js) to your Node.js hosting
4. Deploy frontend build (dist/) to your static hosting or serve via backend

## ❓ Troubleshooting

**Error: "Failed to fetch" or connection errors**
- Make sure the backend server is running on port 3001
- Check that CORS is configured correctly in server/index.js
- Verify your `.env` file has the correct API key

**Error: "API key not valid"**
- Double-check your Gemini API key in `.env`
- Make sure there are no extra spaces or quotes around the key
- Verify the API key is active at [https://ai.google.dev/](https://ai.google.dev/)

**Backend won't start**
- Ensure port 3001 is not in use by another application
- Run `npm install` to ensure all dependencies are installed
- Check the console for specific error messages

## 📱 Mobile Apps (iOS/Android)

The Capacitor configuration is still available for building mobile apps:

```bash
# Android
npm run android:dev

# iOS  
npm run ios:dev
```

Note: You'll need to configure the API_URL in the mobile builds to point to your deployed backend server.

## 📝 License

Proprietary - AppsOrWebs Limited

## 🆘 Support

For issues or questions, check the console logs for detailed error messages.
