# 🚀 Quick Start Guide - AudioMax 2026

## Getting Started

### 1. Install Dependencies
```bash
cd "/Users/m/Desktop/DESK/Build Projects/audiomax"
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 3. Build for Production
```bash
npm run build
```

### 4. Mobile Development

#### Android
```bash
npm run android:dev
```

#### iOS
```bash
npm run ios:dev
```

---

## 🎨 Design Features You'll See

### On Dashboard:
- ✨ **Glassmorphic cards** that float and respond to hover
- 🎨 **Gradient action buttons** for Upload and Record
- 📊 **Animated statistics** with smooth transitions
- 🎭 **Meeting list** with staggered entrance animations

### On Recording Page:
- 🎙️ **3D recording button** with pulsing rings
- 🌊 **Visual waveform** during recording
- ⏱️ **Glassmorphic timer** display
- 🎨 **Smooth state transitions** between recording/processing

### On Transcription Page:
- 📝 **Glassmorphic content sections**
- 🎨 **Gradient tab navigation**
- 📋 **Enhanced copy buttons** with animations
- 🌈 **Color-coded action items** and decisions

### Throughout the App:
- 🎭 **Floating background orbs** creating depth
- ✨ **Gradient text effects** on headings
- 🎨 **Smooth page transitions**
- 🎯 **Interactive hover states** everywhere

---

## 🎯 Key Interactions to Try

1. **Hover over cards** - Watch them scale and glow
2. **Click action buttons** - See gradient animations
3. **Start recording** - Watch the pulsing ring effects
4. **View meetings** - Notice the staggered animations
5. **Navigate tabs** - See smooth gradient transitions

---

## 🎨 Customization

### Change Primary Gradient
Edit `index.css`:
```css
:root {
  --gradient-primary: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Adjust Animation Speed
```css
:root {
  --transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Modify Glass Effect
```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-backdrop: blur(20px) saturate(180%);
}
```

---

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

All components automatically adapt to screen size.

---

## 🎭 Theme Toggle

The app supports both light and dark themes. Use the theme toggle button in the header to switch between modes.

---

## 🚀 Performance Tips

1. **Hardware acceleration** is enabled for all animations
2. **Backdrop filters** use GPU acceleration
3. **Animations** run at 60fps consistently
4. **Images** are optimized for web delivery

---

## 🎨 Color Palette Reference

### Primary Colors
- Purple: `#667eea` → `#764ba2`
- Blue: `#4facfe` → `#00f2fe`
- Pink: `#f093fb` → `#f5576c`

### Accent Colors
- Green: `#2AF598` (Success)
- Yellow: `#fee140` (Warning)
- Red: `#f5576c` (Error)

---

## 🔧 Troubleshooting

### Animations not smooth?
- Check GPU acceleration is enabled in browser
- Reduce motion in accessibility settings if needed

### Glass effects not showing?
- Ensure backdrop-filter is supported in your browser
- Update to latest Chrome/Firefox/Safari

### Gradients looking flat?
- Check color profile settings
- Ensure hardware acceleration is on

---

## 📚 Additional Resources

- Full documentation: `DESIGN_UPGRADE_2026.md`
- Original README: `README.md`
- Deployment guide: `DEPLOYMENT.md`

---

**Enjoy your world-class 2026 design experience! 🎉**
