# AudioMax App Store Deployment Guide

## 📋 Prerequisites

### Developer Accounts Required:
1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - Required for App Store submission

2. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at: https://play.google.com/console/signup
   - Required for Google Play Store submission

### Development Tools:
- **Xcode** (macOS only) - For iOS builds
- **Android Studio** - For Android builds
- **Node.js** and **npm** (already installed)

## 🔧 Step 1: App Configuration

### Update Capacitor Config
Your `capacitor.config.ts` looks good! Current settings:
- App ID: `com.appsorwebs.audiomax`
- App Name: `AudioMax by AppsOrWebs`
- Bundle ready for production

### Required App Assets

#### Icons (Required for both platforms):
- **iOS Icons**: Multiple sizes (20x20 to 1024x1024)
- **Android Icons**: Multiple densities (mdpi to xxxhdpi)
- **Adaptive Icons**: For Android (foreground + background)

#### Splash Screens:
- **iOS**: Multiple device sizes and orientations
- **Android**: Multiple densities and orientations

## 📱 Step 2: iOS App Store Submission

### A. Setup Requirements:
1. **Xcode Installation**:
   ```bash
   # Install from Mac App Store or developer.apple.com
   xcode-select --install
   ```

2. **iOS Development Setup**:
   ```bash
   # Generate iOS project
   npm run build
   npx cap add ios
   npx cap sync ios
   ```

3. **Open in Xcode**:
   ```bash
   npx cap open ios
   ```

### B. Xcode Configuration:
1. **Signing & Capabilities**:
   - Select your Apple Developer Team
   - Enable automatic signing
   - Configure bundle identifier: `com.appsorwebs.audiomax`

2. **App Store Requirements**:
   - Add app icons (required sizes)
   - Configure Info.plist with required permissions
   - Set deployment target (iOS 13.0+)

3. **Privacy Permissions** (Add to Info.plist):
   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>AudioMax needs microphone access to record and transcribe audio.</string>
   <key>NSPhotoLibraryUsageDescription</key>
   <string>AudioMax needs photo library access to save transcription documents.</string>
   ```

### C. Build for App Store:
1. **Archive Build**:
   - In Xcode: Product → Archive
   - Wait for successful archive

2. **Upload to App Store Connect**:
   - Window → Organizer → Archives
   - Select your archive → Distribute App
   - Choose "App Store Connect"
   - Follow upload wizard

### D. App Store Connect Setup:
1. **Create App Listing**:
   - Visit: https://appstoreconnect.apple.com
   - My Apps → + → New App
   - Fill required information

2. **Required Information**:
   - App Name: "AudioMax"
   - Subtitle: "AI-Powered Audio Transcription"
   - Keywords: "transcription, audio, AI, meetings, voice"
   - Description: Compelling app description
   - Screenshots: 6.5", 5.5", 12.9" iPad
   - App Review Information
   - Version Release: Manual or Automatic

3. **Submit for Review**:
   - Complete all required fields
   - Submit for App Store review (7-day average)

## 🤖 Step 3: Google Play Store Submission

### A. Setup Requirements:
1. **Android Studio Installation**:
   ```bash
   # Download from: https://developer.android.com/studio
   # Install Android SDK and tools
   ```

2. **Android Development Setup**:
   ```bash
   # Generate Android project
   npm run build
   npx cap add android
   npx cap sync android
   ```

3. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

### B. Android Studio Configuration:
1. **Gradle Configuration**:
   - Update `android/app/build.gradle`
   - Set version code and version name
   - Configure signing for release builds

2. **App Signing**:
   ```bash
   # Generate signing key
   keytool -genkey -v -keystore audiomax-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias audiomax
   ```

3. **Release Build Configuration**:
   - Add signing config to `build.gradle`
   - Set `minSdkVersion`, `targetSdkVersion`
   - Configure ProGuard/R8 for code optimization

### C. Build Release APK/AAB:
1. **Build Commands**:
   ```bash
   # Build Release APK
   cd android
   ./gradlew assembleRelease
   
   # Build App Bundle (Recommended)
   ./gradlew bundleRelease
   ```

2. **Test Release Build**:
   ```bash
   # Install on device for testing
   adb install app/build/outputs/apk/release/app-release.apk
   ```

### D. Google Play Console Setup:
1. **Create App**:
   - Visit: https://play.google.com/console
   - Create app → Fill basic information

2. **Required Information**:
   - App name: "AudioMax"
   - Short description: "AI-powered audio transcription"
   - Full description: Detailed app description
   - Screenshots: Phone, 7" tablet, 10" tablet
   - Feature graphic (1024x500)
   - App icon (512x512)

3. **Upload App Bundle**:
   - Production → Create new release
   - Upload AAB file
   - Configure release notes

4. **Content Rating & Policies**:
   - Complete content rating questionnaire
   - Privacy policy URL: Required
   - Target audience and content

5. **Publish**:
   - Review and publish to Google Play
   - Review process: Usually 1-3 days

## ⚠️ Important Considerations

### Privacy Policy:
Both stores require a privacy policy. Create one that covers:
- Data collection (audio recordings, user accounts)
- Data usage (transcription, AI processing)
- Data sharing (with Gemini AI service)
- User rights and data deletion

### Testing:
1. **Internal Testing**:
   - Test on multiple devices
   - Verify all features work offline/online
   - Test payment flows (if applicable)

2. **Beta Testing**:
   - iOS: TestFlight beta testing
   - Android: Internal/closed testing tracks

### App Store Optimization (ASO):
- Compelling app icon and screenshots
- Strategic keyword usage
- Positive user reviews and ratings
- Regular updates and feature improvements

## 🎯 Timeline Expectations

### iOS App Store:
- **Preparation**: 2-3 days
- **Review Process**: 7 days average
- **Total**: ~10 days

### Google Play Store:
- **Preparation**: 1-2 days
- **Review Process**: 1-3 days
- **Total**: ~5 days

## 📞 Support & Resources

### Apple:
- Developer Documentation: https://developer.apple.com/documentation/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Support: https://developer.apple.com/support/

### Google:
- Developer Documentation: https://developer.android.com/docs
- Play Console Help: https://support.google.com/googleplay/android-developer/
- Policy Center: https://play.google.com/about/developer-content-policy/

## 🚀 Ready to Deploy!

Your AudioMax app is well-configured with:
- ✅ Professional branding (AppsOrWebs Limited)
- ✅ Capacitor mobile framework
- ✅ Proper app ID and naming
- ✅ Production-ready codebase

Follow this guide step-by-step to successfully launch on both app stores!