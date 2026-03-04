# Setup S3 Bucket for Static Website Hosting
# Usage: .\scripts\setup-s3-bucket.ps1

$BucketName = "tradingui2026"
$Region = "us-east-1"

Write-Host "🚀 Setting up S3 bucket: $BucketName" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if AWS CLI is installed
try {
    $null = Get-Command aws -ErrorAction Stop
    Write-Host "✅ AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "   Visit: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if AWS credentials are configured
try {
    $null = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not configured"
    }
    Write-Host "✅ AWS credentials are configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials are not configured." -ForegroundColor Red
    Write-Host "   Run: aws configure" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Create bucket (if it doesn't exist)
Write-Host "📦 Creating S3 bucket..." -ForegroundColor Cyan
try {
    $bucketExists = aws s3 ls "s3://$BucketName" 2>&1
    if ($LASTEXITCODE -ne 0) {
        aws s3 mb "s3://$BucketName" --region $Region
        Write-Host "✅ Bucket created: $BucketName" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Bucket already exists: $BucketName" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Error creating bucket: $_" -ForegroundColor Yellow
}
Write-Host ""

# Enable static website hosting
Write-Host "🌐 Enabling static website hosting..." -ForegroundColor Cyan
aws s3 website "s3://$BucketName" --index-document index.html --error-document index.html
Write-Host "✅ Static website hosting enabled" -ForegroundColor Green
Write-Host ""

# Set bucket policy for public read access
Write-Host "🔓 Setting bucket policy for public access..." -ForegroundColor Cyan
$bucketPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BucketName/*"
    }
  ]
}
"@

$policyFile = "$env:TEMP\bucket-policy.json"
$bucketPolicy | Out-File -FilePath $policyFile -Encoding utf8

aws s3api put-bucket-policy --bucket $BucketName --policy file:///$policyFile

Remove-Item $policyFile
Write-Host "✅ Bucket policy set" -ForegroundColor Green
Write-Host ""

# Disable block public access
Write-Host "🔓 Disabling block public access..." -ForegroundColor Cyan
aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration `
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
Write-Host "✅ Public access enabled" -ForegroundColor Green
Write-Host ""

# Set CORS configuration
Write-Host "🌍 Setting CORS configuration..." -ForegroundColor Cyan
$corsConfig = @"
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ]
}
"@

$corsFile = "$env:TEMP\cors.json"
$corsConfig | Out-File -FilePath $corsFile -Encoding utf8

aws s3api put-bucket-cors --bucket $BucketName --cors-configuration file:///$corsFile

Remove-Item $corsFile
Write-Host "✅ CORS configuration set" -ForegroundColor Green
Write-Host ""

# Display summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Bucket: $BucketName" -ForegroundColor White
Write-Host "🌐 Website URL: http://$BucketName.s3-website-$Region.amazonaws.com" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Add AWS credentials to GitHub Secrets:" -ForegroundColor White
Write-Host "   - AWS_ACCESS_KEY_ID" -ForegroundColor Gray
Write-Host "   - AWS_SECRET_ACCESS_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Push code to trigger deployment:" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Visit the website URL above after deployment" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
