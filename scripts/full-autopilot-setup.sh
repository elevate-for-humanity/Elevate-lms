#!/bin/bash

# Full Autopilot Setup - Complete Automation
# This script orchestrates the entire autopilot configuration

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Full Autopilot Setup - Complete Automation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")/.."

# Check if puppeteer is installed
if ! pnpm list puppeteer &> /dev/null; then
    echo "📦 Installing Puppeteer..."
    pnpm add -D puppeteer
    echo "✅ Puppeteer installed"
    echo ""
else
    echo "✅ Puppeteer already installed"
    echo ""
fi

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Check if Cloudflare credentials are set
if [ -z "$CLOUDFLARE_EMAIL" ] || [ -z "$CLOUDFLARE_PASSWORD" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔐 Cloudflare Credentials Required"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "To automatically configure Cloudflare API token, please provide:"
    echo ""
    read -p "Cloudflare Email: " CF_EMAIL
    read -sp "Cloudflare Password: " CF_PASSWORD
    echo ""
    echo ""
    
    # Add to .env
    if ! grep -q "CLOUDFLARE_EMAIL=" .env; then
        echo "CLOUDFLARE_EMAIL=$CF_EMAIL" >> .env
    else
        sed -i "s|^CLOUDFLARE_EMAIL=.*|CLOUDFLARE_EMAIL=$CF_EMAIL|" .env
    fi
    
    if ! grep -q "CLOUDFLARE_PASSWORD=" .env; then
        echo "CLOUDFLARE_PASSWORD=$CF_PASSWORD" >> .env
    else
        sed -i "s|^CLOUDFLARE_PASSWORD=.*|CLOUDFLARE_PASSWORD=$CF_PASSWORD|" .env
    fi
    
    export CLOUDFLARE_EMAIL="$CF_EMAIL"
    export CLOUDFLARE_PASSWORD="$CF_PASSWORD"
    
    echo "✅ Credentials saved to .env"
    echo ""
fi

# Step 1: Create Cloudflare API token using Puppeteer
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking Cloudflare API Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ "$CLOUDFLARE_API_TOKEN" = "your-cloudflare-api-token" ] || [ "$CLOUDFLARE_API_TOKEN" = "OKzsSHpywRhxg2wW-wZoMcU5FoQiPXn-lakzATU9" ]; then
    echo "🤖 Launching Enhanced Puppeteer to create/update API token..."
    echo ""
    
    if node scripts/puppeteer-update-cloudflare-token.js; then
        echo "✅ API token created successfully"
        # Reload environment
        export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    else
        echo "⚠️  Automatic token creation failed"
        echo ""
        echo "Please create token manually:"
        echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
        echo "2. Click 'Create Token'"
        echo "3. Use 'Edit Cloudflare Workers' template"
        echo "4. Add these permissions:"
        echo "   - Workers Scripts:Edit"
        echo "   - Workers KV Storage:Edit"
        echo "   - Account Settings:Read"
        echo "5. Copy the token and paste below"
        echo ""
        read -p "Cloudflare API Token: " CF_TOKEN
        
        if [ -n "$CF_TOKEN" ]; then
            sed -i "s|^CLOUDFLARE_API_TOKEN=.*|CLOUDFLARE_API_TOKEN=$CF_TOKEN|" .env
            export CLOUDFLARE_API_TOKEN="$CF_TOKEN"
            echo "✅ Token saved"
        else
            echo "❌ No token provided, exiting"
            exit 1
        fi
    fi
else
    echo "✅ Using existing Cloudflare API token"
fi
echo ""

# Step 2: Run automatic configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Configuring Autopilot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./scripts/auto-configure-autopilot.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Full Autopilot Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your autopilot is now fully configured and running!"
echo ""
echo "What happens now:"
echo "  ✅ GitHub Actions run inline checks automatically"
echo "  ✅ Results feed into Durable Objects"
echo "  ✅ Historical data is preserved"
echo "  ✅ Metrics available via API"
echo "  ✅ Alerts sent on critical issues"
echo ""
echo "View your metrics:"
echo "  curl https://efh-autopilot-metrics.workers.dev/summary | jq"
echo ""
echo "Configuration saved to: autopilot-config-summary.txt"
echo ""
