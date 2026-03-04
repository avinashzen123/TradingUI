# Quick Fix Deployment Guide

## What Was Fixed

Fixed 403 errors in production by making the app use direct Upstox URLs instead of trying to fetch from S3 bucket.

## Deploy the Fix

### Option 1: Push to GitHub (Automatic)
```bash
git add .
git commit -m "Fix: Use direct Upstox URLs in production"
git push origin main
```

Wait 2-3 minutes for GitHub Actions to build and deploy.

### Option 2: Manual Deployment
```bash
# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://tradingui2026 --delete

# Invalidate CloudFront (if using)
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## Verify the Fix

1. **Visit your website**
   ```
   http://tradingui2026.s3-website-us-east-1.amazonaws.com
   ```

2. **Open browser console** (F12)

3. **Try to add an instrument**
   - Click the floating button (bottom-left)
   - Click "+ Add"
   - Select NSE or MCX
   - Search for an instrument

4. **Check console logs**
   
   You should see:
   ```
   [InstrumentService] Fetching from: https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz
   ```
   
   NOT:
   ```
   [InstrumentService] Fetching from: /api/assets/market-quote/instruments/exchange/NSE.json.gz
   ```

5. **Verify no 403 errors**
   - Check Network tab
   - All requests should return 200 OK
   - No 403 Forbidden errors

## What Changed

### Before (Broken in Production)
```javascript
// Tried to fetch from S3 bucket
const url = '/api/upstox/v3/historical-candle/...';
// Result: 403 error (file doesn't exist on S3)
```

### After (Works in Production)
```javascript
// Fetches directly from Upstox
const url = 'https://api.upstox.com/v3/historical-candle/...';
// Result: 200 OK (direct API call)
```

### Development Still Works
```javascript
// In development, still uses proxy
const url = '/api/upstox/v3/historical-candle/...';
// Vite proxy redirects to https://api.upstox.com
```

## Files Modified

- ✅ `src/services/InstrumentService.js`
- ✅ `src/services/UpstoxService.js`
- ✅ `src/services/ChartService.js`

## Testing Checklist

After deployment:
- [ ] Website loads without errors
- [ ] Can open instruments drawer (floating button)
- [ ] Can search for instruments (NSE/MCX)
- [ ] Instruments load successfully
- [ ] Can add instrument to analysis
- [ ] Charts load with data
- [ ] No 403 errors in console
- [ ] No CORS errors in console

## If Issues Persist

### Clear Browser Cache
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Check Deployment
```bash
# Verify files are updated on S3
aws s3 ls s3://tradingui2026/assets/ --recursive

# Check file timestamps (should be recent)
```

### Check Console Logs
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

### Common Issues

#### Still Getting 403
- Clear browser cache
- Verify deployment completed
- Check file timestamps on S3
- Hard refresh (Ctrl+Shift+R)

#### CORS Errors
- Upstox APIs support CORS
- Should work from browser
- If issues persist, see PRODUCTION_API_FIX.md

#### Mixed Content Errors
- Ensure using HTTPS (via CloudFront)
- All API calls should use HTTPS

## Rollback (If Needed)

If the fix causes issues:

```bash
# Revert changes
git revert HEAD
git push origin main

# Or restore previous S3 version
# (if S3 versioning is enabled)
```

## Next Steps

1. ✅ Deploy the fix
2. ✅ Test in production
3. ⚠️ Monitor for any issues
4. ⚠️ Consider adding CloudFront for HTTPS
5. ⚠️ Set up error monitoring

## Support

See detailed documentation:
- `PRODUCTION_API_FIX.md` - Technical details
- `DEPLOYMENT_GUIDE.md` - Full deployment guide
- `DEPLOYMENT_QUICK_START.md` - Quick setup

## Summary

The fix is simple:
- Development: Uses proxy URLs
- Production: Uses direct Upstox URLs
- No backend changes needed
- Works with existing S3 deployment

Deploy and test! 🚀
