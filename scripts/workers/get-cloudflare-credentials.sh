#!/usr/bin/env bash
# Worker Task: Get Cloudflare Credentials
# This script guides a human worker through getting Cloudflare credentials

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "☁️  WORKER TASK: Get Cloudflare Credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This task will guide you through getting Cloudflare credentials."
echo "Cloudflare is OPTIONAL but recommended for:"
echo "  • Video hosting (Cloudflare Stream)"
echo "  • File storage (Cloudflare R2)"
echo "  • CDN and performance"
echo ""

read -p "Do you want to set up Cloudflare? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "⏭️  Skipping Cloudflare setup."
  echo "   You can run this script later if needed."
  echo ""
  exit 0
fi

echo ""
echo "📋 STEP-BY-STEP INSTRUCTIONS:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PART 1: Create Cloudflare Account"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Go to: https://dash.cloudflare.com/sign-up"
echo ""
echo "2️⃣  Sign up:"
echo "    • Enter email and password"
echo "    • Verify your email"
echo "    • Log in to dashboard"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PART 2: Get Account ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "3️⃣  Get your Account ID:"
echo "    • In Cloudflare Dashboard"
echo "    • Look at the right sidebar"
echo "    • Find 'Account ID' (32-character hex string)"
echo "    • Click to copy"
echo ""

read -p "📝 Enter your Cloudflare Account ID: " CF_ACCOUNT_ID

if [ -z "$CF_ACCOUNT_ID" ]; then
  echo "❌ Error: Account ID cannot be empty"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PART 3: Create API Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "4️⃣  Create API Token:"
echo "    • Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "    • Click 'Create Token'"
echo "    • Choose 'Create Custom Token'"
echo ""
echo "5️⃣  Configure token permissions:"
echo "    • Token name: Elevate LMS"
echo "    • Permissions:"
echo "      - Account | Stream | Edit"
echo "      - Account | Account Settings | Read"
echo "      - Zone | Zone | Read"
echo "    • Account Resources: Include | Your Account"
echo "    • Click 'Continue to summary'"
echo "    • Click 'Create Token'"
echo "    • COPY THE TOKEN (you won't see it again!)"
echo ""

read -p "📝 Enter your Cloudflare API Token: " CF_API_TOKEN

if [ -z "$CF_API_TOKEN" ]; then
  echo "❌ Error: API Token cannot be empty"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PART 4: Cloudflare Stream (Video Hosting)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "6️⃣  Enable Cloudflare Stream:"
echo "    • Go to: https://dash.cloudflare.com/stream"
echo "    • Click 'Enable Stream'"
echo "    • Pricing: \$1 per 1,000 minutes stored + \$1 per 1,000 minutes delivered"
echo "    • Free tier: First 1,000 minutes free"
echo ""

read -p "Do you want to use Cloudflare Stream for videos? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  CF_STREAM_TOKEN="$CF_API_TOKEN"
  STORAGE_TYPE="cloudflare-stream"
  echo "✅ Cloudflare Stream enabled"
else
  CF_STREAM_TOKEN=""
  STORAGE_TYPE="local"
  echo "⏭️  Skipping Cloudflare Stream (using local storage)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PART 5: Cloudflare R2 (Object Storage - Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "7️⃣  Cloudflare R2 (alternative to Stream):"
echo "    • Go to: https://dash.cloudflare.com/r2"
echo "    • Click 'Create bucket'"
echo "    • Bucket name: elevate-lms-videos"
echo "    • Location: Automatic"
echo "    • Click 'Create bucket'"
echo ""
echo "8️⃣  Create R2 API Token:"
echo "    • In R2 dashboard, click 'Manage R2 API Tokens'"
echo "    • Click 'Create API token'"
echo "    • Token name: Elevate LMS R2"
echo "    • Permissions: Object Read & Write"
echo "    • Click 'Create API Token'"
echo "    • SAVE: Access Key ID and Secret Access Key"
echo ""

read -p "Do you want to use Cloudflare R2? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "📝 Enter R2 Bucket Name: " CF_R2_BUCKET
  read -p "📝 Enter R2 Access Key ID: " CF_R2_ACCESS_KEY
  read -p "📝 Enter R2 Secret Access Key: " CF_R2_SECRET_KEY
  read -p "📝 Enter R2 Public URL (optional): " CF_R2_PUBLIC_URL
  
  if [ "$STORAGE_TYPE" = "local" ]; then
    STORAGE_TYPE="cloudflare-r2"
  fi
  
  echo "✅ Cloudflare R2 configured"
else
  CF_R2_BUCKET=""
  CF_R2_ACCESS_KEY=""
  CF_R2_SECRET_KEY=""
  CF_R2_PUBLIC_URL=""
  echo "⏭️  Skipping Cloudflare R2"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Credentials collected. Updating .env.local..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update .env.local
if [ -f .env.local ]; then
  # Backup existing file
  cp .env.local .env.local.backup
  
  # Update values using sed
  sed -i "s|CLOUDFLARE_ACCOUNT_ID=.*|CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID|g" .env.local
  sed -i "s|CLOUDFLARE_API_TOKEN=.*|CLOUDFLARE_API_TOKEN=$CF_API_TOKEN|g" .env.local
  sed -i "s|CLOUDFLARE_STREAM_API_TOKEN=.*|CLOUDFLARE_STREAM_API_TOKEN=$CF_STREAM_TOKEN|g" .env.local
  sed -i "s|STORAGE_TYPE=.*|STORAGE_TYPE=$STORAGE_TYPE|g" .env.local
  
  if [ -n "$CF_R2_BUCKET" ]; then
    sed -i "s|CLOUDFLARE_R2_BUCKET=.*|CLOUDFLARE_R2_BUCKET=$CF_R2_BUCKET|g" .env.local
    sed -i "s|CLOUDFLARE_R2_ACCESS_KEY_ID=.*|CLOUDFLARE_R2_ACCESS_KEY_ID=$CF_R2_ACCESS_KEY|g" .env.local
    sed -i "s|CLOUDFLARE_R2_SECRET_ACCESS_KEY=.*|CLOUDFLARE_R2_SECRET_ACCESS_KEY=$CF_R2_SECRET_KEY|g" .env.local
    sed -i "s|CLOUDFLARE_R2_PUBLIC_URL=.*|CLOUDFLARE_R2_PUBLIC_URL=$CF_R2_PUBLIC_URL|g" .env.local
  fi
  
  echo "✅ Updated .env.local (backup saved as .env.local.backup)"
else
  echo "⚠️  Warning: .env.local not found. Creating Cloudflare-only config..."
  cat > .env.cloudflare << EOF
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID
CLOUDFLARE_API_TOKEN=$CF_API_TOKEN
CLOUDFLARE_STREAM_API_TOKEN=$CF_STREAM_TOKEN
STORAGE_TYPE=$STORAGE_TYPE
CLOUDFLARE_R2_BUCKET=$CF_R2_BUCKET
CLOUDFLARE_R2_ACCESS_KEY_ID=$CF_R2_ACCESS_KEY
CLOUDFLARE_R2_SECRET_ACCESS_KEY=$CF_R2_SECRET_KEY
CLOUDFLARE_R2_PUBLIC_URL=$CF_R2_PUBLIC_URL
EOF
  echo "✅ Created .env.cloudflare with Cloudflare credentials"
  echo "⚠️  Merge this with your main .env.local file"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 TASK COMPLETE: Cloudflare credentials configured"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Storage type: $STORAGE_TYPE"
echo ""
echo "Next steps:"
echo "  • Test video upload functionality"
echo "  • Monitor Cloudflare usage in dashboard"
echo "  • Set up billing alerts (recommended)"
echo ""
echo "📚 Resources:"
echo "  • Cloudflare Stream: https://dash.cloudflare.com/stream"
echo "  • Cloudflare R2: https://dash.cloudflare.com/r2"
echo "  • API Tokens: https://dash.cloudflare.com/profile/api-tokens"
echo ""
