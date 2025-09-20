#!/bin/bash

# AudioMax App Store Deployment Script
# Run this script to prepare your app for store submission

echo "🚀 AudioMax Deployment Script"
echo "============================="

# Step 1: Build the web app
echo "📦 Building web application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Web build successful"
else
    echo "❌ Web build failed"
    exit 1
fi

# Step 2: Sync with mobile platforms
echo "📱 Syncing with mobile platforms..."
npx cap sync

if [ $? -eq 0 ]; then
    echo "✅ Mobile sync successful"
else
    echo "❌ Mobile sync failed"
    exit 1
fi

# Step 3: iOS build preparation
echo "🍎 Preparing iOS build..."
npx cap sync ios
echo "📝 Open Xcode with: npx cap open ios"

# Step 4: Android build preparation  
echo "🤖 Preparing Android build..."
npx cap sync android
echo "📝 Open Android Studio with: npx cap open android"

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. For iOS: Run 'npx cap open ios' and build in Xcode"
echo "2. For Android: Run 'npx cap open android' and build in Android Studio"
echo "3. Follow the detailed guide in app-store-guide.md"
echo ""
echo "🎯 App Details:"
echo "   App ID: com.appsorwebs.audiomax"
echo "   App Name: AudioMax by AppsOrWebs"
echo "   Company: AppsOrWebs Limited"