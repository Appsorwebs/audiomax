# 🔑 Free API Key Setup Guide

## Overview
AudioMax provides free API access to users who sign up, using a pool of Gemini API keys with usage limits and rate limiting.

## Setup Instructions

### 1. Get Free Gemini API Keys

1. **Visit Google AI Studio**: https://ai.google.dev/
2. **Sign up** for a free account
3. **Create API Key**: 
   - Go to "Get API Key" section
   - Click "Create API Key"
   - Copy the generated key

### 2. Configure Multiple Keys for Better Distribution

To handle more users, get multiple free API keys:

1. **Create multiple Google accounts** (or use existing ones)
2. **Get an API key from each account**
3. **Add all keys to the service**

### 3. Update the Free API Service

Edit `/services/freeApiService.ts`:

```typescript
// Replace the demo keys with your actual Gemini API keys
private readonly FREE_API_KEYS = [
  'AIzaSyYour_Real_API_Key_1_Here',
  'AIzaSyYour_Real_API_Key_2_Here', 
  'AIzaSyYour_Real_API_Key_3_Here',
  // Add more keys for better load distribution
];
```

### 4. Free Tier Limits Per Key

Each free Gemini API key includes:
- **15 requests per minute**
- **1,500 requests per day**
- **1 million tokens per month**

### 5. AudioMax Free User Limits

We set conservative limits to ensure good service:
- **10 transcriptions per day per user**
- **50 transcriptions per week per user**
- **5 minutes maximum audio length**
- **5-minute rate limit between requests**

## Key Management Strategy

### Load Balancing
- Keys are rotated using round-robin selection
- Spreads usage across all available keys
- Prevents hitting single key limits

### Usage Tracking
- Daily usage reset at midnight
- Weekly usage reset on Sundays
- Rate limiting prevents abuse

### Scaling Options

#### Option 1: More Free Keys
- Add more free Google accounts
- Get API key from each account
- Add to the FREE_API_KEYS array

#### Option 2: Paid Keys for Premium
- Get paid Gemini API keys for premium users
- Higher limits and better performance
- Users can also add their own keys

## Security Considerations

### API Key Protection
```typescript
// ✅ Good - Keys in server environment
const apiKey = process.env.GEMINI_API_KEY;

// ❌ Bad - Keys in client code (never do this)
const apiKey = 'AIzaSy...'; // Visible to all users
```

### Rate Limiting
- Prevents single user from consuming all quota
- 5-minute cooldown between requests
- Daily and weekly limits

### Usage Monitoring
- Track API usage per key
- Monitor for unusual patterns
- Auto-rotate keys if needed

## Production Deployment

### Environment Variables
```bash
# .env.production
VITE_FREE_API_ENABLED=true
GEMINI_FREE_KEY_1=AIzaSy...
GEMINI_FREE_KEY_2=AIzaSy...
GEMINI_FREE_KEY_3=AIzaSy...
```

### Monitoring Dashboard
Consider adding:
- API usage metrics
- Key rotation status
- User limit tracking
- Error rate monitoring

## Upgrade Path

### For Users
- Free tier: Limited usage with free keys
- Pro tier: Higher limits with paid keys
- Premium tier: Users can add their own keys

### For Business
- Get paid Gemini Pro API access
- Higher rate limits
- Better performance
- Priority support

## Legal Considerations

### Terms of Service
Update your terms to include:
- Free tier usage limits
- Fair use policy
- Upgrade requirements for heavy usage

### Privacy Policy
Include information about:
- API key usage
- Data processing through Google AI
- Usage tracking and limits

## Troubleshooting

### Common Issues

1. **"API Key Invalid"**
   - Check if key is correctly copied
   - Verify key hasn't been deleted
   - Ensure account is active

2. **"Rate Limit Exceeded"**
   - Add more API keys to pool
   - Increase time between requests
   - Check if single key is overused

3. **"Daily Limit Reached"**
   - Add more keys for better distribution
   - Consider upgrading to paid keys
   - Implement better load balancing

### Monitoring Commands
```bash
# Check API key status
curl -X GET "https://generativelanguage.googleapis.com/v1/models" \
  -H "X-API-Key: YOUR_API_KEY"

# Test API key
curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## Ready for Production!

Once you've added real API keys:

1. ✅ **Free users get 10 transcriptions/day**
2. ✅ **Multiple keys for load balancing**
3. ✅ **Rate limiting prevents abuse**
4. ✅ **Usage tracking and limits**
5. ✅ **Upgrade path to premium**

Your AudioMax app will provide excellent free service while encouraging upgrades for heavy users!