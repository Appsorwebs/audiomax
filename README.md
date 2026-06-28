# 🎙️ AudioMax by AppsOrWebs Limited

## 🌟 AI-Powered Audio Transcription & Meeting Analysis

React 19 + TypeScript + Capacitor 7 + Vite 2026 Standard

**AudioMax** is a world-class, 2026 standard AI-powered audio transcription and meeting analysis application developed by **AppsOrWebs Limited**. Transform your audio recordings into accurate transcripts, intelligent summaries, and actionable insights with a **stunning premium UI**.

---

## ✨ Features

### 🎯 Core Functionality
- 🎯 **AI-Powered Transcription** — Convert audio to text with high accuracy using Google Gemini AI
- 🤖 **Smart Meeting Summaries** — Generate intelligent summaries with key points and action items
- 🌍 **Multi-Language Translation** — Translate summaries to different languages
- 📱 **Cross-Platform** — Available on Web, iOS, and Android
- 🔐 **Secure Authentication** — User accounts with admin notification system
- 📊 **Meeting Analytics** — Track and organize your meeting history
- 💾 **Secure Local Storage** — Encrypted local data storage for transcriptions and summaries

### 🎨 Premium UI/UX (2026 Standard)
- ✨ **Glassmorphism Design** — Frosted glass effects with beautiful transparency
- 🎭 **Neumorphic Elements** — Soft, tactile 3D design elements
- 🌈 **Gradient-Rich Interface** — Modern color gradients throughout
- 💫 **Advanced Micro-interactions** — Smooth hover effects, scale transitions, glow effects
- 🎬 **Premium Animations** — Slide-ins, fade-ins, pulse effects, shimmer loading
- 🌙 **Dark Theme Native** — Designed dark-first for eye comfort
- 📱 **Fully Responsive** — Perfect on mobile, tablet, and desktop
- ♿ **Accessibility-First** — ARIA labels, keyboard navigation, focus states

---

## 🎨 Design Showcase

Our 2026 standard design features:
- **Glass-morphic cards** with backdrop blur
- **Gradient buttons** with glow effects
- **Premium stat cards** with trend indicators
- **Modern processing overlay** with animated progress
- **Smooth page transitions** and hover animations
- **Professional color palette** optimized for dark themes

For detailed design documentation, see [UI_UPGRADE_GUIDE.md](./UI_UPGRADE_GUIDE.md)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- For mobile development: Xcode (iOS) and/or Android Studio (Android)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/audiomax.git
cd audiomax

# Install dependencies
npm install

# Start development server
npm run dev
```

### Mobile Development

```bash
# Build for production
npm run build

# iOS development
npm run ios:dev

# Android development  
npm run android:dev
```

### Test and Quality Gates

```bash
# TypeScript strict check
npm run typecheck

# Full test suite (unit + upload smoke)
npm test

# Audio upload format integration checks
npm run test:audio-formats
```

---

## 📱 Mobile App Deployment

This app is ready for deployment to both app stores:

- **App ID**: `com.appsorwebs.audiomax`
- **App Name**: AudioMax
- **Developer**: AppsOrWebs Limited

### Deploy to App Stores

```bash
# Run the automated deployment script
./deploy-to-stores.sh
```

For detailed deployment instructions, see [`app-store-guide.md`](app-store-guide.md).

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Mobile**: Capacitor 7 for native iOS/Android apps
- **AI**: Google Gemini AI for transcription and analysis
- **Styling**: Tailwind CSS v4 + PostCSS with dark mode support
- **Build Tool**: Vite for fast development and optimized builds
- **Authentication**: Custom secure authentication system

---

## 📂 Project Structure

```
audiomax/
├── components/          # React components
│   ├── icons/          # SVG icon components
│   └── ui/             # Reusable UI components
├── services/           # API services (AI, auth, admin)
├── contexts/           # React contexts (theme)
├── utils/              # Utility functions
├── android/            # Android Capacitor project
├── ios/                # iOS Capacitor project
├── dist/               # Production build output
└── public/             # Static assets (manifest, icons)
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Capacitor Configuration

The app is configured for production in [`capacitor.config.ts`](capacitor.config.ts) with:
- Splash screen configuration
- HTTPS scheme for Android
- Production build optimizations

---

## 🔐 Security Features

- Input sanitization for all user inputs
- Secure token storage
- Admin notification system for user activities
- Environment validation
- XSS protection
- Rate limiting for API calls
- File validation for uploads
- DevTools protection in production

---

## 📈 Features Roadmap

- [ ] Real-time collaboration
- [ ] Advanced audio editing
- [ ] Custom AI models
- [ ] Integration with calendar apps
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features

---

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software developed by AppsOrWebs Limited. All rights reserved.

---

## 🏢 About AppsOrWebs Limited

AudioMax is developed by [AppsOrWebs Limited](https://appsorwebs.com), a leading software development company specializing in AI-powered applications and cross-platform mobile solutions.

---

## 📞 Support

- **Website**: [appsorwebs.com](https://appsorwebs.com)
- **Email**: admin@appsorwebs.com

---

<div align="center">
  <p>Made with ❤️ by <a href="https://appsorwebs.com">AppsOrWebs Limited</a></p>
  <p>Transform your conversations into actionable insights with the power of AI.</p>
</div>
