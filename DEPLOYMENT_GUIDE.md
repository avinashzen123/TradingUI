# Deployment Guide - GitHub Actions to S3

## Overview
This project uses GitHub Actions to automatically build and deploy the React application to AWS S3 whenever code is pushed to the main/master branch.

## Workflow File
Location: `.github/workflows/deploy.yml`

## What It Does

### 1. Trigger Events
The workflow runs on:
- **Push to main/master**: Automatic deployment on code push
- **Manual trigger**: Can be triggered manually from GitHub Actions tab

### 2. Build Process
1. Checks out the code
2. Sets up Node.js 20
3. Installs dependencies with `npm ci` (clean install)
4. Builds the project with `npm run build`
5. Creates production-ready files in `dist/` folder

### 3. Deployment Process
1. Configures AWS credentials from GitHub Secrets
2. Syncs `dist/` folder to S3 bucket `tradingui2026`
3. Sets cache headers for optimal performance
4. Optionally invalidates CloudFront cache

## Setup Instructions

### Step 1: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

#### Required Secrets:
1. **AWS_ACCESS_KEY_ID**
   - Your AWS access key ID
   - Example: `AKIAIOSFODNN7EXAMPLE`

2. **AWS_SECRET_ACCESS_KEY**
   - Your AWS secret access key
   - Example: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

#### Optional Secrets:
3. **CLOUDFRONT_DISTRIBUTION_ID** (if using CloudFront)
   - Your CloudFront distribution ID
   - Example: `E1234567890ABC`

### Step 2: Create IAM User (AWS Console)

1. Go to AWS IAM Console
2. Create a new user: `github-actions-deploy`
3. Attach this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::tradingui2026",
        "arn:aws:s3:::tradingui2026/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

4. Create access keys for this user
5. Copy the Access Key ID and Secret Access Key
6. Add them to GitHub Secrets

### Step 3: Configure S3 Bucket

#### Enable Static Website Hosting
1. Go to S3 Console → `tradingui2026` bucket
2. Properties → Static website hosting → Enable
3. Index document: `index.html`
4. Error document: `index.html` (for SPA routing)

#### Set Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tradingui2026/*"
    }
  ]
}
```

#### Configure CORS (if needed)
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### Step 4: Test Deployment

1. Push code to main/master branch:
   ```bash
   git add .
   git commit -m "Setup GitHub Actions deployment"
   git push origin main
   ```

2. Go to GitHub → Actions tab
3. Watch the workflow run
4. Check S3 bucket for deployed files

## Workflow Details

### Cache Strategy
The workflow uses two different cache strategies:

1. **Static Assets** (JS, CSS, images):
   - Cache-Control: `public, max-age=31536000, immutable`
   - Cached for 1 year (assets have hashed filenames)

2. **index.html**:
   - Cache-Control: `public, max-age=0, must-revalidate`
   - Always fetches latest version

### Sync Command
```bash
aws s3 sync dist/ s3://tradingui2026 --delete
```
- `--delete`: Removes files from S3 that don't exist in dist/
- Ensures S3 matches the build output exactly

### CloudFront Invalidation
If you have CloudFront in front of S3:
- Automatically invalidates cache after deployment
- Ensures users get the latest version immediately
- Only runs if `CLOUDFRONT_DISTRIBUTION_ID` secret is set

## Manual Deployment

### From GitHub UI
1. Go to Actions tab
2. Select "Build and Deploy to S3" workflow
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow" button

### From Local Machine
```bash
# Build locally
npm run build

# Deploy to S3 (requires AWS CLI configured)
aws s3 sync dist/ s3://tradingui2026 --delete
```

## Monitoring Deployments

### GitHub Actions
- Go to Actions tab to see deployment history
- Click on any workflow run to see logs
- Green checkmark = successful deployment
- Red X = failed deployment

### S3 Console
- Check bucket contents after deployment
- Verify file timestamps
- Check file sizes

### Website
- Visit your S3 website URL
- Check browser console for errors
- Verify latest changes are live

## Troubleshooting

### Build Fails
**Error**: `npm ci` fails
**Solution**: 
- Check package-lock.json is committed
- Ensure Node version matches (20)
- Check for dependency conflicts

**Error**: `npm run build` fails
**Solution**:
- Check for TypeScript/ESLint errors
- Run build locally first
- Check build logs in Actions tab

### Deployment Fails
**Error**: Access Denied
**Solution**:
- Verify AWS credentials in GitHub Secrets
- Check IAM policy permissions
- Ensure bucket name is correct

**Error**: Bucket not found
**Solution**:
- Verify bucket name: `tradingui2026`
- Check AWS region matches
- Ensure bucket exists

### Website Not Updating
**Issue**: Old version still showing
**Solution**:
- Clear browser cache (Ctrl+Shift+R)
- Check S3 file timestamps
- Invalidate CloudFront cache
- Check cache headers

## Performance Optimization

### Build Optimization
The workflow uses:
- `npm ci` for faster, reliable installs
- Node.js cache for faster subsequent builds
- Production build mode

### Deployment Optimization
- Only uploads changed files (sync)
- Parallel uploads (AWS CLI default)
- Optimal cache headers

### Expected Build Time
- First build: ~2-3 minutes
- Subsequent builds: ~1-2 minutes (with cache)

## Cost Estimation

### GitHub Actions
- 2,000 free minutes/month for public repos
- Unlimited for public repos
- Each deployment: ~2 minutes

### AWS S3
- Storage: ~$0.023 per GB/month
- Requests: ~$0.0004 per 1,000 requests
- Data transfer: First 100 GB free/month

### Estimated Monthly Cost
- Small app (<100 MB): ~$0.50/month
- Medium traffic (10k visits): ~$1-2/month

## Security Best Practices

### GitHub Secrets
✅ Never commit AWS credentials to code
✅ Use GitHub Secrets for sensitive data
✅ Rotate credentials regularly
✅ Use least-privilege IAM policies

### S3 Bucket
✅ Enable versioning for rollback capability
✅ Enable server access logging
✅ Use CloudFront for HTTPS
✅ Enable bucket encryption

### IAM User
✅ Create dedicated user for deployments
✅ Use minimal required permissions
✅ Enable MFA for console access
✅ Rotate access keys every 90 days

## Rollback Procedure

### Using S3 Versioning
1. Enable versioning on S3 bucket
2. Go to S3 Console → bucket → Versions
3. Find previous version
4. Restore previous version

### Using Git
1. Revert to previous commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Workflow will automatically deploy previous version

### Manual Rollback
1. Checkout previous commit locally
2. Build: `npm run build`
3. Deploy: `aws s3 sync dist/ s3://tradingui2026`

## Advanced Configuration

### Custom Build Command
Edit `.github/workflows/deploy.yml`:
```yaml
- name: Build project
  run: npm run build
  env:
    NODE_ENV: production
    VITE_API_URL: ${{ secrets.API_URL }}
```

### Multiple Environments
Create separate workflows:
- `deploy-staging.yml` → `tradingui2026-staging`
- `deploy-production.yml` → `tradingui2026`

### Build Artifacts
Save build artifacts for debugging:
```yaml
- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: dist
    path: dist/
```

## Environment Variables

If your app needs environment variables:

1. Add to GitHub Secrets
2. Use in workflow:
```yaml
- name: Build project
  run: npm run build
  env:
    VITE_API_URL: ${{ secrets.VITE_API_URL }}
    VITE_API_KEY: ${{ secrets.VITE_API_KEY }}
```

3. Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Notifications

### Slack Notifications
Add to workflow:
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications
GitHub sends email notifications by default for:
- Failed workflows
- First successful workflow after failures

## Workflow Badge

Add to README.md:
```markdown
![Deploy Status](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Build%20and%20Deploy%20to%20S3/badge.svg)
```

## Files Structure After Deployment

```
s3://tradingui2026/
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-def456.css
│   └── logo-ghi789.png
└── vite.svg
```

## Testing Checklist

After deployment, verify:
- [ ] Website loads at S3 URL
- [ ] All pages are accessible
- [ ] Images load correctly
- [ ] API calls work (if applicable)
- [ ] No console errors
- [ ] Mobile responsive works
- [ ] Browser cache works correctly

## Support

### GitHub Actions Logs
- Detailed logs available in Actions tab
- Download logs for offline analysis
- Logs retained for 90 days

### AWS CloudWatch
- Enable S3 access logging
- Monitor request patterns
- Track errors and performance

## Next Steps

1. ✅ Set up GitHub Secrets
2. ✅ Configure S3 bucket
3. ✅ Push code to trigger deployment
4. ✅ Verify deployment successful
5. ⚠️ Consider adding CloudFront
6. ⚠️ Set up custom domain
7. ⚠️ Enable HTTPS
8. ⚠️ Configure monitoring

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS CLI S3 Commands](https://docs.aws.amazon.com/cli/latest/reference/s3/)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
