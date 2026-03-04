# Deployment Checklist

## Pre-Deployment Setup

### AWS Setup
- [ ] AWS account created
- [ ] AWS CLI installed
- [ ] AWS credentials configured locally (for testing)

### S3 Bucket Setup
- [ ] Run setup script: `./scripts/setup-s3-bucket.sh` or `.\scripts\setup-s3-bucket.ps1`
- [ ] Verify bucket created: `tradingui2026`
- [ ] Static website hosting enabled
- [ ] Bucket policy set (public read)
- [ ] CORS configured
- [ ] Note website URL

### IAM User Setup
- [ ] Create IAM user: `github-actions-deploy`
- [ ] Attach S3 permissions policy
- [ ] Attach CloudFront permissions (optional)
- [ ] Create access keys
- [ ] Save Access Key ID
- [ ] Save Secret Access Key

### GitHub Setup
- [ ] Repository created/exists
- [ ] Code pushed to GitHub
- [ ] Go to Settings → Secrets → Actions
- [ ] Add secret: `AWS_ACCESS_KEY_ID`
- [ ] Add secret: `AWS_SECRET_ACCESS_KEY`
- [ ] Add secret: `CLOUDFRONT_DISTRIBUTION_ID` (optional)

## First Deployment

### Verify Workflow File
- [ ] File exists: `.github/workflows/deploy.yml`
- [ ] Bucket name correct: `tradingui2026`
- [ ] Region correct: `us-east-1`
- [ ] Node version: 20

### Test Build Locally
- [ ] Run: `npm install`
- [ ] Run: `npm run build`
- [ ] Verify `dist/` folder created
- [ ] Check `dist/index.html` exists
- [ ] Check `dist/assets/` folder exists

### Deploy
- [ ] Commit all changes
- [ ] Push to main/master branch
- [ ] Go to GitHub → Actions tab
- [ ] Watch workflow run
- [ ] Wait for green checkmark (✅)

### Verify Deployment
- [ ] Check GitHub Actions logs
- [ ] Go to S3 Console
- [ ] Verify files uploaded
- [ ] Check file timestamps
- [ ] Visit website URL
- [ ] Test all pages
- [ ] Check browser console (no errors)
- [ ] Test on mobile device

## Post-Deployment

### Testing
- [ ] Homepage loads
- [ ] Navigation works
- [ ] All pages accessible
- [ ] Images load correctly
- [ ] Styles applied correctly
- [ ] JavaScript works
- [ ] API calls work (if applicable)
- [ ] Mobile responsive
- [ ] Different browsers tested

### Performance
- [ ] Page load time acceptable
- [ ] Images optimized
- [ ] Cache headers working
- [ ] No console errors
- [ ] No 404 errors

### Security
- [ ] HTTPS enabled (via CloudFront)
- [ ] No credentials in code
- [ ] Bucket policy correct
- [ ] IAM permissions minimal
- [ ] Access logging enabled (optional)

## Optional Enhancements

### CloudFront CDN
- [ ] Create CloudFront distribution
- [ ] Point to S3 bucket
- [ ] Configure SSL certificate
- [ ] Add distribution ID to GitHub Secrets
- [ ] Test CloudFront URL
- [ ] Update DNS (if custom domain)

### Custom Domain
- [ ] Register domain
- [ ] Create Route 53 hosted zone
- [ ] Add DNS records
- [ ] Configure CloudFront alternate domain
- [ ] Request SSL certificate
- [ ] Verify domain works

### Monitoring
- [ ] Enable S3 access logging
- [ ] Setup CloudWatch alarms
- [ ] Configure error notifications
- [ ] Add uptime monitoring
- [ ] Setup analytics (optional)

### Backup & Recovery
- [ ] Enable S3 versioning
- [ ] Test rollback procedure
- [ ] Document recovery steps
- [ ] Setup automated backups

## Maintenance

### Regular Tasks
- [ ] Monitor deployment logs
- [ ] Check error rates
- [ ] Review access logs
- [ ] Update dependencies
- [ ] Rotate AWS credentials (every 90 days)

### Monthly
- [ ] Review AWS costs
- [ ] Check storage usage
- [ ] Review access patterns
- [ ] Update documentation

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Backup verification
- [ ] Disaster recovery test

## Troubleshooting Checklist

### Build Fails
- [ ] Check Node version (should be 20)
- [ ] Verify package-lock.json committed
- [ ] Check for TypeScript errors
- [ ] Check for ESLint errors
- [ ] Test build locally
- [ ] Review GitHub Actions logs

### Deployment Fails
- [ ] Verify AWS credentials in GitHub Secrets
- [ ] Check IAM permissions
- [ ] Verify bucket name correct
- [ ] Check AWS region
- [ ] Review error message in logs
- [ ] Test AWS CLI locally

### Website Not Loading
- [ ] Check bucket policy (public read)
- [ ] Verify static website hosting enabled
- [ ] Check index.html exists
- [ ] Clear browser cache
- [ ] Check browser console
- [ ] Verify DNS (if custom domain)

### Website Not Updating
- [ ] Check deployment succeeded
- [ ] Verify files uploaded to S3
- [ ] Check file timestamps
- [ ] Clear browser cache (Ctrl+Shift+R)
- [ ] Invalidate CloudFront cache
- [ ] Check cache headers

## Emergency Procedures

### Rollback
- [ ] Identify last working version
- [ ] Option 1: Git revert + push
- [ ] Option 2: Restore from S3 versions
- [ ] Option 3: Manual upload from backup
- [ ] Verify rollback successful
- [ ] Notify team

### Incident Response
- [ ] Identify issue
- [ ] Check monitoring/logs
- [ ] Assess impact
- [ ] Implement fix
- [ ] Test fix
- [ ] Deploy fix
- [ ] Verify resolution
- [ ] Document incident

## Documentation

### Keep Updated
- [ ] README.md
- [ ] DEPLOYMENT_GUIDE.md
- [ ] Architecture diagrams
- [ ] Runbooks
- [ ] Contact information

### Version Control
- [ ] Tag releases
- [ ] Document changes
- [ ] Update changelog
- [ ] Archive old versions

## Team Onboarding

### New Team Member Setup
- [ ] Share documentation
- [ ] Grant GitHub access
- [ ] Grant AWS console access (read-only)
- [ ] Explain deployment process
- [ ] Show monitoring tools
- [ ] Review emergency procedures

## Compliance

### Security
- [ ] No secrets in code
- [ ] Credentials rotated regularly
- [ ] Access logs enabled
- [ ] Encryption enabled
- [ ] Backup strategy documented

### Legal
- [ ] Privacy policy updated
- [ ] Terms of service current
- [ ] Cookie consent (if applicable)
- [ ] GDPR compliance (if applicable)

## Success Criteria

### Deployment
✅ Workflow runs without errors
✅ Build completes successfully
✅ Files uploaded to S3
✅ Website accessible
✅ All features working
✅ No console errors

### Performance
✅ Page load < 3 seconds
✅ Time to interactive < 5 seconds
✅ No 404 errors
✅ Cache hit rate > 80%

### Reliability
✅ Uptime > 99.9%
✅ Deployment success rate > 95%
✅ Rollback time < 5 minutes

## Notes

- Keep this checklist updated
- Review after each deployment
- Share with team members
- Document any issues encountered
- Celebrate successful deployments! 🎉
