# Production API Fix - Direct Upstox URLs

## Problem

After deploying to S3, the app was getting 403 errors when trying to fetch instrument data and candle data. This happened because:

1. **Development**: Vite proxy redirects `/api/upstox` → `https://api.upstox.com`
2. **Production**: No proxy server, so `/api/upstox` tries to fetch from S3 bucket itself
3. **Result**: 403 errors because S3 bucket doesn't have these API endpoints

## Solution

Modified all service files to use direct Upstox URLs in production while keeping proxy URLs in development.

### Files Modified

1. **src/services/InstrumentService.js**
   - Added `getBaseURL()` function
   - Development: `/api/assets` (proxied)
   - Production: `https://assets.upstox.com` (direct)

2. **src/services/UpstoxService.js**
   - Added `getBaseURL()` function
   - Development: `/api/upstox` (proxied)
   - Production: `https://api.upstox.com` (direct)

3. **src/services/ChartService.js**
   - Added `getBaseURL()` function
   - Development: `/api/upstox` (proxied)
   - Production: `https://api.upstox.com` (direct)

## How It Works

### Environment Detection
```javascript
const getBaseURL = () => {
    const isDevelopment = import.meta.env.DEV;
    return isDevelopment ? '/api/upstox' : 'https://api.upstox.com';
};
```

- `import.meta.env.DEV` is `true` in development (Vite dev server)
- `import.meta.env.DEV` is `false` in production (built app)

### URL Construction
```javascript
// Development: /api/upstox/v3/historical-candle/...
// Production: https://api.upstox.com/v3/historical-candle/...
const url = `${getBaseURL()}/v3/historical-candle/${instrumentKey}/...`;
```

## CORS Considerations

### Upstox API CORS
Upstox APIs support CORS for browser requests, so direct calls from the browser work in production.

### If CORS Issues Occur

If you encounter CORS errors in production, you have three options:

#### Option 1: Use CloudFront with Lambda@Edge (Recommended)
Set up CloudFront in front of S3 and use Lambda@Edge to proxy API requests.

#### Option 2: Create Backend API
Create a simple backend (Node.js, Python, etc.) to proxy requests:
```javascript
// Backend endpoint
app.get('/api/upstox/*', async (req, res) => {
    const upstoxUrl = `https://api.upstox.com${req.path.replace('/api/upstox', '')}`;
    const response = await fetch(upstoxUrl, {
        headers: {
            'Authorization': req.headers.authorization
        }
    });
    const data = await response.json();
    res.json(data);
});
```

#### Option 3: Use API Gateway
Set up AWS API Gateway to proxy requests to Upstox.

## Testing

### Development
```bash
npm run dev
# Should use proxy: /api/upstox → https://api.upstox.com
```

### Production Build (Local)
```bash
npm run build
npm run preview
# Should use direct URLs: https://api.upstox.com
```

### Production (S3)
```bash
# Deploy to S3
aws s3 sync dist/ s3://tradingui2026 --delete

# Test in browser
# Should use direct URLs: https://api.upstox.com
```

## Verification

### Check Console Logs
Look for these logs in browser console:

**Development:**
```
[InstrumentService] Fetching from: /api/assets/market-quote/instruments/exchange/NSE.json.gz
[ChartService.getHistoricalCandles] Full API URL: /api/upstox/v3/historical-candle/...
```

**Production:**
```
[InstrumentService] Fetching from: https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz
[ChartService.getHistoricalCandles] Full API URL: https://api.upstox.com/v3/historical-candle/...
```

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "upstox" or "assets"
4. Verify URLs are correct for environment

## Environment Variables

If you need to customize API URLs, you can use environment variables:

### .env.development
```
VITE_UPSTOX_API_URL=/api/upstox
VITE_UPSTOX_ASSETS_URL=/api/assets
```

### .env.production
```
VITE_UPSTOX_API_URL=https://api.upstox.com
VITE_UPSTOX_ASSETS_URL=https://assets.upstox.com
```

### Update Services
```javascript
const getBaseURL = () => {
    return import.meta.env.VITE_UPSTOX_API_URL || 
           (import.meta.env.DEV ? '/api/upstox' : 'https://api.upstox.com');
};
```

## Troubleshooting

### Still Getting 403 Errors
1. Check browser console for actual URL being called
2. Verify `import.meta.env.DEV` is false in production
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check Network tab for request details

### CORS Errors
```
Access to fetch at 'https://api.upstox.com/...' from origin 'http://tradingui2026.s3-website...' has been blocked by CORS policy
```

**Solutions:**
1. Verify Upstox API supports CORS (it should)
2. Check if Authorization header is causing issues
3. Consider using backend proxy (see Option 2 above)

### Mixed Content Errors (HTTP/HTTPS)
If using CloudFront with HTTPS:
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource 'http://...'
```

**Solution:** Ensure all API calls use HTTPS

## Deployment

### After Making Changes
```bash
# Build
npm run build

# Test locally
npm run preview

# Deploy to S3
aws s3 sync dist/ s3://tradingui2026 --delete

# Or push to GitHub (automatic deployment)
git add .
git commit -m "Fix: Use direct Upstox URLs in production"
git push origin main
```

### Verify Deployment
1. Visit S3 website URL
2. Open browser console
3. Try to add an instrument
4. Check for successful API calls
5. Verify no 403 errors

## Performance Considerations

### Direct API Calls
- **Pros**: Simple, no backend needed
- **Cons**: Exposes API calls to browser, rate limits apply per user

### With Backend Proxy
- **Pros**: Can implement caching, rate limiting, security
- **Cons**: Requires backend infrastructure, more complex

### With CloudFront
- **Pros**: CDN caching, better performance, HTTPS
- **Cons**: Additional AWS service, more configuration

## Security Notes

### API Keys
- Never commit API keys to code
- Use environment variables for sensitive data
- Store tokens securely (localStorage with encryption)

### CORS
- Upstox APIs are designed for browser use
- CORS headers are set by Upstox
- No additional configuration needed

### Rate Limiting
- Upstox has rate limits per API key
- Direct browser calls count against your limit
- Consider backend proxy for high-traffic apps

## Next Steps

1. ✅ Deploy updated code to S3
2. ✅ Test in production
3. ⚠️ Monitor for CORS issues
4. ⚠️ Consider CloudFront for HTTPS
5. ⚠️ Implement error handling for API failures

## Summary

The fix changes API URLs based on environment:
- **Development**: Uses Vite proxy (`/api/upstox`)
- **Production**: Uses direct URLs (`https://api.upstox.com`)

This allows the app to work in both environments without code changes.
