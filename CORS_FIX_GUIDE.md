# CORS Fix Guide - Instrument Files

## Problem

Upstox's assets server (`assets.upstox.com`) doesn't allow CORS requests from browser, causing this error:

```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz. (Reason: CORS header 'Access-Control-Allow-Origin' missing).
```

## Solution

Download instrument files and include them in your build. The files will be served from your S3 bucket (same origin).

## Quick Fix (Manual Download)

### Step 1: Create Directory
```bash
mkdir -p public/instruments
```

### Step 2: Download Files

#### Option A: Using Browser
1. Open these URLs in your browser:
   - NSE: https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz
   - MCX: https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz

2. Save files to `public/instruments/` folder:
   - Save as: `NSE.json.gz`
   - Save as: `MCX.json.gz`

#### Option B: Using curl (if available)
```bash
# NSE
curl -o public/instruments/NSE.json.gz https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz

# MCX
curl -o public/instruments/MCX.json.gz https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz
```

#### Option C: Using wget (if available)
```bash
# NSE
wget -O public/instruments/NSE.json.gz https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz

# MCX
wget -O public/instruments/MCX.json.gz https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz
```

#### Option D: Using PowerShell (Windows)
```powershell
# Create directory
New-Item -ItemType Directory -Force -Path public\instruments

# Download NSE
Invoke-WebRequest -Uri "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz" -OutFile "public\instruments\NSE.json.gz"

# Download MCX
Invoke-WebRequest -Uri "https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz" -OutFile "public\instruments\MCX.json.gz"
```

### Step 3: Verify Files
```bash
ls -lh public/instruments/
# Should show:
# NSE.json.gz (~15-20 MB)
# MCX.json.gz (~1-2 MB)
```

### Step 4: Build and Deploy
```bash
# Build
npm run build

# Deploy
git add public/instruments/
git commit -m "Add instrument files for CORS fix"
git push origin main
```

## Automated Solution (For CI/CD)

Since GitHub Actions runs on a server (not browser), it can download the files without CORS issues.

### Update GitHub Actions Workflow

Edit `.github/workflows/deploy.yml`:

```yaml
- name: Download instrument files
  run: |
    mkdir -p public/instruments
    curl -o public/instruments/NSE.json.gz https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz || echo "NSE download failed"
    curl -o public/instruments/MCX.json.gz https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz || echo "MCX download failed"
    ls -lh public/instruments/

- name: Build project
  run: npm run build
```

This downloads fresh files on every deployment.

## How It Works

### Before (CORS Error)
```
Browser → https://assets.upstox.com/... 
❌ CORS Error (different origin)
```

### After (Same Origin)
```
Browser → https://tradingui2026.s3.amazonaws.com/instruments/NSE.json.gz
✅ Success (same origin)
```

## File Structure

```
public/
└── instruments/
    ├── NSE.json.gz  (~15-20 MB)
    └── MCX.json.gz  (~1-2 MB)

After build:
dist/
└── instruments/
    ├── NSE.json.gz
    └── MCX.json.gz

After deployment:
s3://tradingui2026/
└── instruments/
    ├── NSE.json.gz
    └── MCX.json.gz
```

## Updating Instrument Files

Instrument files should be updated periodically (daily/weekly) as new instruments are added.

### Manual Update
1. Download latest files (see Step 2 above)
2. Replace files in `public/instruments/`
3. Build and deploy

### Automated Update (Recommended)
Add to GitHub Actions workflow to download fresh files on every deployment.

## Alternative Solutions

### Option 1: Backend Proxy (Best for Production)
Create a backend API to proxy requests:

```javascript
// Backend (Node.js/Express)
app.get('/api/instruments/:exchange', async (req, res) => {
    const url = `https://assets.upstox.com/market-quote/instruments/exchange/${req.params.exchange}.json.gz`;
    const response = await fetch(url);
    const buffer = await response.buffer();
    res.set('Content-Type', 'application/gzip');
    res.send(buffer);
});
```

### Option 2: CloudFront with Lambda@Edge
Use AWS CloudFront to proxy requests to Upstox.

### Option 3: API Gateway
Set up AWS API Gateway to proxy requests.

## Troubleshooting

### Files Not Loading
**Check**:
1. Files exist in `public/instruments/`
2. Files are included in build (`dist/instruments/`)
3. Files are uploaded to S3
4. Browser console shows correct URL

### 404 Error
**Problem**: Files not found
**Solution**: 
- Verify files in `public/instruments/`
- Rebuild: `npm run build`
- Redeploy

### Still CORS Error
**Problem**: App still trying to fetch from Upstox
**Solution**:
- Clear browser cache
- Verify InstrumentService.js is updated
- Check console for URL being fetched

### Files Too Large
**Problem**: Git complains about large files
**Solution**:
- Add to `.gitignore` (already done)
- Download during build (GitHub Actions)
- Use Git LFS (optional)

## Testing

### Local Testing
```bash
# Download files
# (use one of the methods above)

# Build
npm run build

# Preview
npm run preview

# Test in browser
# Should load instruments without CORS error
```

### Production Testing
```bash
# Deploy
git push origin main

# Wait for deployment (2-3 min)

# Test
# Visit: http://tradingui2026.s3-website-us-east-1.amazonaws.com
# Try adding instrument
# Should work without CORS error
```

## Verification

### Check Files Exist
```bash
# Local
ls -lh public/instruments/

# S3
aws s3 ls s3://tradingui2026/instruments/
```

### Check Console
Browser console should show:
```
[InstrumentService] Fetching from: /instruments/NSE.json.gz
✅ Success (200 OK)
```

NOT:
```
[InstrumentService] Fetching from: https://assets.upstox.com/...
❌ CORS Error
```

## Summary

1. ✅ Download instrument files manually or via script
2. ✅ Place in `public/instruments/` folder
3. ✅ Files will be included in build
4. ✅ Deployed to S3 with your app
5. ✅ Loaded from same origin (no CORS)

## Next Steps

1. Download files (see Step 2)
2. Commit and push
3. Wait for deployment
4. Test in browser
5. Verify no CORS errors

## File Sizes

- NSE.json.gz: ~15-20 MB (compressed)
- MCX.json.gz: ~1-2 MB (compressed)
- Total: ~17-22 MB

These files will be included in your S3 bucket but won't significantly impact costs.

## Cost Impact

- Storage: ~$0.50/month for 20 MB
- Transfer: Included in free tier (first 100 GB)
- Total: Negligible cost increase
