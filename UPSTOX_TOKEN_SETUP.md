# Upstox Token Setup Guide

## Why You Need This

The app requires an Upstox API token to:
- Fetch real-time candle data
- Load historical price data
- Display charts and indicators
- Access holdings and positions

Without the token, you'll see this error:
```
[CandleDataUpdater] Missing required data: token: false
```

## Quick Setup (2 Minutes)

### Step 1: Get Your Upstox Access Token

#### Option A: From Upstox Developer Console
1. Go to [Upstox Developer Console](https://api.upstox.com/)
2. Log in with your Upstox credentials
3. Create an app (if you haven't already)
4. Generate an access token
5. Copy the token

#### Option B: From Upstox API Documentation
1. Visit [Upstox API Docs](https://upstox.com/developer/api-documentation)
2. Follow the authentication flow
3. Get your access token

### Step 2: Add Token to App

1. **Open the app** in your browser
2. **Go to Settings page** (click Settings in sidebar)
3. **Paste your token** in the "Upstox Access Token" field
4. **Click Save**

That's it! The token is now saved and will be used for all API calls.

## Where to Find Settings

### Desktop
- Click "Settings" in the left sidebar

### Mobile
- Tap the menu icon (☰)
- Tap "Settings"

## Token Storage

- Token is stored in browser's localStorage
- Persists across page refreshes
- Stored securely in your browser only
- Never sent to any server except Upstox API

## Token Expiry

Upstox tokens typically expire after:
- **24 hours** for regular tokens
- **1 year** for long-lived tokens (if configured)

When token expires:
- You'll see authentication errors
- Charts won't load
- Need to generate new token and update in Settings

## Security Notes

### ✅ Safe Practices
- Only use your own Upstox token
- Don't share your token with others
- Regenerate token if compromised
- Use app on trusted devices only

### ⚠️ Important
- Token gives access to your Upstox account
- Can view holdings, positions, and place orders
- Keep it secure like a password

## Troubleshooting

### Token Not Saving
**Problem**: Token field is empty after refresh
**Solution**: 
- Check browser allows localStorage
- Try different browser
- Disable private/incognito mode

### Still Getting "Token Not Found" Error
**Problem**: Token saved but still showing error
**Solution**:
1. Refresh the page (F5)
2. Clear browser cache (Ctrl+Shift+R)
3. Re-enter token in Settings
4. Check browser console for errors

### Authentication Errors
**Problem**: "401 Unauthorized" or "Invalid token"
**Solution**:
- Token may have expired
- Generate new token from Upstox
- Update in Settings

### Charts Not Loading
**Problem**: Token is set but charts don't load
**Solution**:
1. Verify token is valid (test in Upstox API docs)
2. Check browser console for errors
3. Verify internet connection
4. Check Upstox API status

## Testing Your Token

### Quick Test
1. Add token in Settings
2. Go to Analysis Dashboard
3. Add an instrument (e.g., NIFTY)
4. Charts should load with data

### Console Verification
1. Open browser console (F12)
2. Type: `localStorage.getItem('dailyData')`
3. Should see your token in the output

## Token Format

Upstox tokens look like this:
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

If your token doesn't look similar, it may be invalid.

## Alternative: Environment Variable (For Developers)

If you're running the app locally, you can set the token as an environment variable:

### .env.local
```
VITE_UPSTOX_TOKEN=your_token_here
```

### Update Code
In `src/store/dailyDataSlice.js`, add default token:
```javascript
const initialState = {
    UPSTOX_TOKEN: import.meta.env.VITE_UPSTOX_TOKEN || ''
};
```

## For Production Deployment

### Option 1: Users Enter Token (Current)
- Each user enters their own token
- Most secure
- No shared credentials

### Option 2: Pre-configured Token
- Set token during build
- All users share same token
- Less secure
- Good for personal use only

### Option 3: Backend Proxy
- Store token on backend
- Frontend requests go through backend
- Most secure for multi-user apps
- Requires backend infrastructure

## FAQ

### Q: Do I need a paid Upstox account?
**A**: No, free Upstox account works. You just need API access.

### Q: Can I use someone else's token?
**A**: Technically yes, but not recommended. Use your own token for security.

### Q: How often do I need to update the token?
**A**: Depends on token expiry. Daily tokens need daily updates. Long-lived tokens last longer.

### Q: What if I don't have an Upstox account?
**A**: You need an Upstox account to get a token. Sign up at [upstox.com](https://upstox.com)

### Q: Can I use the app without a token?
**A**: No, the token is required to fetch data from Upstox API.

### Q: Is my token safe?
**A**: Token is stored in your browser's localStorage. It's as safe as your browser. Don't use on public/shared computers.

## Getting Help

### Upstox API Support
- Email: api@upstox.com
- Docs: https://upstox.com/developer/api-documentation
- Forum: https://forum.upstox.com/

### App Issues
- Check browser console for errors
- Verify token is valid
- Try regenerating token
- Clear browser cache

## Summary

1. ✅ Get Upstox access token
2. ✅ Open app Settings page
3. ✅ Paste token and save
4. ✅ Refresh page
5. ✅ Start using the app!

The token is required for the app to work. Without it, you'll see errors and charts won't load.
