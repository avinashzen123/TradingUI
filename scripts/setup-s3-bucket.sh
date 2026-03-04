#!/bin/bash

# Setup S3 Bucket for Static Website Hosting
# Usage: ./scripts/setup-s3-bucket.sh

BUCKET_NAME="tradingui2026"
REGION="us-east-1"

echo "🚀 Setting up S3 bucket: $BUCKET_NAME"
echo "================================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "   Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured."
    echo "   Run: aws configure"
    exit 1
fi

echo "✅ AWS CLI is configured"
echo ""

# Create bucket (if it doesn't exist)
echo "📦 Creating S3 bucket..."
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    echo "✅ Bucket created: $BUCKET_NAME"
else
    echo "ℹ️  Bucket already exists: $BUCKET_NAME"
fi
echo ""

# Enable static website hosting
echo "🌐 Enabling static website hosting..."
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html
echo "✅ Static website hosting enabled"
echo ""

# Set bucket policy for public read access
echo "🔓 Setting bucket policy for public access..."
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/bucket-policy.json

rm /tmp/bucket-policy.json
echo "✅ Bucket policy set"
echo ""

# Disable block public access
echo "🔓 Disabling block public access..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
echo "✅ Public access enabled"
echo ""

# Set CORS configuration
echo "🌍 Setting CORS configuration..."
cat > /tmp/cors.json << EOF
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
EOF

aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file:///tmp/cors.json

rm /tmp/cors.json
echo "✅ CORS configuration set"
echo ""

# Get website endpoint
WEBSITE_URL=$(aws s3api get-bucket-website --bucket "$BUCKET_NAME" --query 'WebsiteConfiguration' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "================================================"
    echo "✅ Setup complete!"
    echo ""
    echo "📍 Bucket: $BUCKET_NAME"
    echo "🌐 Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
    echo ""
    echo "Next steps:"
    echo "1. Add AWS credentials to GitHub Secrets:"
    echo "   - AWS_ACCESS_KEY_ID"
    echo "   - AWS_SECRET_ACCESS_KEY"
    echo ""
    echo "2. Push code to trigger deployment:"
    echo "   git push origin main"
    echo ""
    echo "3. Visit the website URL above after deployment"
    echo "================================================"
else
    echo "⚠️  Could not retrieve website endpoint"
    echo "   Bucket: $BUCKET_NAME"
    echo "   Region: $REGION"
fi
