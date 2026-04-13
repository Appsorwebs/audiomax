# 🚀 AudioMax Quick Reference Guide

## Component Quick Reference

### Import Components
```tsx
// Premium UI Components
import { GlassCard } from './components/ui/GlassCard';
import { PremiumButton } from './components/ui/PremiumButton';
import { PremiumInput } from './components/ui/PremiumInput';
import { StatCard } from './components/ui/StatCard';
import { ActionCard } from './components/ui/ActionCard';
import { ProgressBar } from './components/ui/ProgressBar';
import { Toast } from './components/ui/Toast';
import { PremiumHeader } from './components/ui/PremiumHeader';
```

---

## Common Patterns

### Glass Card Container
```tsx
<GlassCard variant="premium" className="p-6">
  <h3 className="text-2xl font-bold text-neutral-100">Title</h3>
  <p className="text-neutral-400">Content</p>
</GlassCard>
```

### Primary Action Button
```tsx
<PremiumButton 
  variant="gradient" 
  size="lg"
  onClick={handleClick}
>
  Click Me
</PremiumButton>
```

### Form Input with Icon
```tsx
<PremiumInput
  label="Email Address"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  icon={<EmailIcon />}
  error={emailError}
/>
```

### Statistics Display
```tsx
<StatCard
  title="Total Users"
  value={10234}
  subtitle="Active this month"
  icon="👥"
  trend="up"
  trendValue="+12%"
/>
```

### Loading State
```tsx
<PremiumButton loading={isProcessing}>
  Process
</PremiumButton>
```

---

## CSS Classes Quick Reference

### Layout
```css
.flex              /* display: flex */
.flex-col          /* flex-direction: column */
.grid              /* display: grid */
.gap-4             /* gap: 1rem */
.items-center      /* align-items: center */
.justify-between   /* justify-content: space-between */
```

### Spacing
```css
.p-4               /* padding: 1rem */
.p-6               /* padding: 1.5rem */
.p-8               /* padding: 2rem */
.mb-4              /* margin-bottom: 1rem */
.mb-6              /* margin-bottom: 1.5rem */
.mt-8              /* margin-top: 2rem */
```

### Glass Effects
```css
.glass             /* Basic glass effect */
.glass-premium     /* Premium glass with blur */
.glass-deep        /* Deep glass with color */
```

### Buttons
```css
.btn               /* Base button */
.btn-primary       /* Primary gradient button */
.btn-secondary     /* Glass secondary button */
.btn-gradient      /* Rainbow gradient button */
.btn-success       /* Success green button */
.btn-danger        /* Danger red button */
```

### Badges
```css
.badge             /* Base badge */
.badge-primary     /* Primary blue badge */
.badge-success     /* Success green badge */
.badge-warning     /* Warning orange badge */
.badge-danger      /* Danger red badge */
```

### Text
```css
.gradient-primary  /* Gradient text effect */
.text-center       /* text-align: center */
.truncate          /* Text ellipsis */
```

---

## Color Variables

### Primary Colors
```css
var(--primary-400)    /* #38bdf8 - Light blue */
var(--primary-500)    /* #0ea5e9 - Main blue */
var(--primary-600)    /* #0284c7 - Dark blue */
```

### Secondary Colors
```css
var(--secondary-500)  /* #8b5cf6 - Purple */
var(--accent-500)     /* #ec4899 - Pink */
```

### Semantic Colors
```css
var(--success-500)    /* #10b981 - Green */
var(--warning-500)    /* #f59e0b - Orange */
var(--danger-500)     /* #ef4444 - Red */
```

### Neutrals
```css
var(--neutral-950)    /* #030712 - Darkest */
var(--neutral-900)    /* #0f172a - Very dark */
var(--neutral-800)    /* #1e293b - Dark */
var(--neutral-400)    /* #94a3b8 - Medium */
var(--neutral-100)    /* #f1f5f9 - Light */
```

---

## Animation Classes

### Keyframe Animations
```css
/* Loading spinner */
animation: spin 1s linear infinite;

/* Pulse effect */
animation: pulse 2s ease-in-out infinite;

/* Glow effect */
animation: glow 2s ease-in-out infinite;

/* Slide in from bottom */
animation: slideInUp 0.3s ease-out;

/* Fade in */
animation: fadeIn 0.3s ease-out;
```

---

## Common Responsive Patterns

### Mobile First Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Content */}
</div>
```

### Hide on Mobile
```tsx
<div className="hidden md:block">
  {/* Desktop only */}
</div>
```

### Responsive Text
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

---

## Common State Patterns

### Loading State
```tsx
const [loading, setLoading] = useState(false);

<PremiumButton loading={loading}>
  {loading ? 'Processing...' : 'Submit'}
</PremiumButton>
```

### Form State
```tsx
const [formData, setFormData] = useState({
  email: '',
  password: ''
});

const [errors, setErrors] = useState({});

<PremiumInput
  value={formData.email}
  onChange={(e) => setFormData({...formData, email: e.target.value})}
  error={errors.email}
/>
```

### Toast Notification
```tsx
const [showToast, setShowToast] = useState(false);

{showToast && (
  <Toast
    message="Success!"
    type="success"
    onClose={() => setShowToast(false)}
  />
)}
```

---

## Performance Tips

### ✅ DO
- Use `transform` and `opacity` for animations
- Leverage CSS variables
- Use `will-change` sparingly for frequently animated elements
- Memoize expensive components with `React.memo`

### ❌ DON'T
- Animate `width`, `height`, `top`, `left` properties
- Use excessive backdrop filters
- Create unnecessary re-renders
- Inline styles with complex calculations

---

## Accessibility Checklist

- ✅ Add `aria-label` to icon-only buttons
- ✅ Include focus states (automatic with CSS classes)
- ✅ Ensure proper heading hierarchy (h1 → h2 → h3)
- ✅ Use semantic HTML (`<button>`, `<nav>`, etc.)
- ✅ Provide alt text for images
- ✅ Maintain sufficient color contrast
- ✅ Support keyboard navigation

---

## Common Mistakes to Avoid

### ❌ Wrong
```tsx
<div style={{ background: 'rgba(255,255,255,0.1)' }}>
```

### ✅ Right
```tsx
<div className="glass-premium">
```

---

### ❌ Wrong
```tsx
<button className="bg-blue-500" onClick={...}>
```

### ✅ Right
```tsx
<PremiumButton variant="primary" onClick={...}>
```

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Run with backend
npm run dev:full

# Mobile builds
npm run android:dev
npm run ios:dev
```

---

## File Structure

```
components/
├── ui/                    # Reusable UI components
│   ├── GlassCard.tsx
│   ├── PremiumButton.tsx
│   ├── PremiumInput.tsx
│   ├── StatCard.tsx
│   ├── ActionCard.tsx
│   ├── ProgressBar.tsx
│   ├── Toast.tsx
│   └── PremiumHeader.tsx
├── Dashboard.tsx          # Main dashboard
├── Header.tsx            # App header
├── PricingPage.tsx       # Pricing page
└── ProcessingOverlay.tsx # Loading overlay
```

---

## Resources

- 📖 **UI_UPGRADE_GUIDE.md** - Complete design documentation
- 📋 **UPGRADE_SUMMARY.md** - What's new overview
- 📝 **README.md** - Project documentation
- 🎨 **public/design-showcase.html** - Visual showcase

---

**Happy coding! 🚀**
