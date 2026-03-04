# Deployment Quick Start Guide

## 5-Minute Setup

### Step 1: Setup S3 Bucket (2 minutes)

#### Option A: Using Script (Recommended)
```bash
# Linux/Mac
chmod +x scripts/setup-s3-bucket.sh
./scripts/setup-s3-bucket.sh

# Windows PowerShell
.\scripts\setup-s3-bucket.ps1
```

#### Option B: Manual Setup
1. Go to AWS S3 Console
2. Create bucket: `tradingui2026`
3. Enable static website hosting
4. Set bucket policy (see DEPLOYMENT_GUIDE.md)

### Step 2: Create IAM User (2 minutes)

1. Go to AWS IAM Console
2. Create user: `github-actions-deploy`
3. Attach policy:
   - S3: PutObject, GetObject, DeleteObject, ListBucket
   - CloudFront: CreateInvalidation (optional)
4. Create access keys
5. Save Access Key ID and Secret Access Key

### Step 3: Add GitHub Secrets (1 minute)

Go to: GitHub Repo → Settings → Secrets → Actions

Add these secrets:
- `AWS_ACCESS_KEY_ID`: Your access key ID
- `AWS_SECRET_ACCESS_KEY`: Your secret access key
- `CLOUDFRONT_DISTRIBUTION_ID`: (optional) Your CloudFront ID

### Step 4: Deploy! (30 seconds)

```bash
git add .
git commit -m "Setup deployment"
git push origin main
```

Watch deployment: GitHub → Actions tab

## Verify Deployment

1. Go to GitHub Actions tab
2. Wait for green checkmark (✅)
3. Visit: `http://tradingui2026.s3-website-us-east-1.amazonaws.com`

## Troubleshooting

### Build Fails
```bash
# Test build locally
npm install
npm run build
```

### Deployment Fails
- Check AWS credentials in GitHub Secrets
- Verify bucket name: `tradingui2026`
- Check IAM permissions

### Website Not Loading
- Check S3 bucket policy (must allow public read)
- Verify static website hosting is enabled
- Check browser console for errors

## Manual Deployment (Backup)

```bash
# Build
npm run build

# Deploy (requires AWS CLI configured)
aws s3 sync dist/ s3://tradingui2026 --delete
```

## Next Steps

- [ ] Add custom domain
- [ ] Setup CloudFront CDN
- [ ] Enable HTTPS
- [ ] Configure monitoring

## Support

See detailed guide: `DEPLOYMENT_GUIDE.md`

## Common Commands

```bash
# Check deployment status
aws s3 ls s3://tradingui2026

# View website
open http://tradingui2026.s3-website-us-east-1.amazonaws.com

# Clear CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# Download current deployment
aws s3 sync s3://tradingui2026 ./backup
```

## Workflow File

Location: `.github/workflows/deploy.yml`

Triggers:
- Push to main/master
- Manual trigger from Actions tab

## Cost

Expected: ~$0.50-2/month
- S3 storage: ~$0.023/GB
- S3 requests: ~$0.0004/1k requests
- Data transfer: First 100GB free

## Security Checklist

- [x] AWS credentials in GitHub Secrets (not in code)
- [x] IAM user with minimal permissions
- [ ] Enable S3 versioning (for rollback)
- [ ] Enable CloudFront (for HTTPS)
- [ ] Setup custom domain
- [ ] Enable access logging

## Deployment Flow

```
Code Push → GitHub Actions → Build → Test → Deploy to S3 → Live!
   ↓            ↓              ↓       ↓         ↓           ↓
  main      Checkout        npm     (none)   aws s3    Website
 branch      code          build             sync      Updated
```

## Files Deployed

```
s3://tradingui2026/
├── index.html (entry point)
├── assets/
│   ├── index-[hash].js (app code)
│   ├── index-[hash].css (styles)
│   └── [images]
└── vite.svg (favicon)
```

## Cache Strategy

- **Static assets** (JS/CSS/images): Cached 1 year
- **index.html**: No cache (always fresh)

## Monitoring

- GitHub Actions: Deployment logs
- S3 Console: File timestamps
- CloudWatch: Access logs (if enabled)
- Website: Browser console

## Rollback

### Quick Rollback
```bash
git revert HEAD
git push origin main
```

### Manual Rollback
1. Enable S3 versioning
2. Restore previous version from S3 Console

## Environment Variables

If needed, add to workflow:
```yaml
env:
  VITE_API_URL: ${{ secrets.VITE_API_URL }}
```

## Multiple Environments

Create separate workflows:
- `deploy-staging.yml` → `tradingui2026-staging`
- `deploy-production.yml` → `tradingui2026`

## Success Criteria

✅ GitHub Actions shows green checkmark
✅ S3 bucket contains files
✅ Website loads at S3 URL
✅ No console errors
✅ All pages accessible

## Getting Help

1. Check GitHub Actions logs
2. Review DEPLOYMENT_GUIDE.md
3. Check AWS CloudWatch logs
4. Verify IAM permissions
5. Test build locally

## Useful Links

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [AWS S3 Static Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
