# Deployment Section for README.md

Add this section to your README.md file:

---

## 🚀 Deployment

This project uses GitHub Actions for automated deployment to AWS S3.

### Quick Setup (5 minutes)

1. **Setup S3 Bucket**
   ```bash
   # Linux/Mac
   ./scripts/setup-s3-bucket.sh
   
   # Windows
   .\scripts\setup-s3-bucket.ps1
   ```

2. **Add GitHub Secrets**
   
   Go to: Repository → Settings → Secrets → Actions
   
   Add these secrets:
   - `AWS_ACCESS_KEY_ID` - Your AWS access key
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

3. **Deploy**
   ```bash
   git push origin main
   ```

4. **Visit Your Site**
   
   `http://tradingui2026.s3-website-us-east-1.amazonaws.com`

### Documentation

- 📖 [Full Deployment Guide](DEPLOYMENT_GUIDE.md)
- ⚡ [Quick Start Guide](DEPLOYMENT_QUICK_START.md)
- 📋 [Deployment Summary](DEPLOYMENT_SUMMARY.md)

### Deployment Status

![Deploy Status](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Build%20and%20Deploy%20to%20S3/badge.svg)

### Manual Deployment

```bash
# Build
npm run build

# Deploy (requires AWS CLI)
aws s3 sync dist/ s3://tradingui2026 --delete
```

---

## Alternative: Add to existing README

If you already have a README.md, add this badge at the top:

```markdown
![Deploy Status](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Build%20and%20Deploy%20to%20S3/badge.svg)
```

And add this section:

```markdown
## Deployment

Automatic deployment to AWS S3 on push to main branch.

**Website**: http://tradingui2026.s3-website-us-east-1.amazonaws.com

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for setup instructions.
```
