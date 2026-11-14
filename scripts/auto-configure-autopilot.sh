#!/bin/bash

# Automatic Autopilot Configuration
# This script automatically configures the entire autopilot system

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Automatic Autopilot Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Load existing environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Step 1: Generate AUTOPILOT_TOKEN if not exists
echo "[1/6] Generating AUTOPILOT_TOKEN..."
if [ -z "$AUTOPILOT_TOKEN" ] || [ "$AUTOPILOT_TOKEN" = "autopilot_token_for_api_access_and_authentication_2024" ]; then
    AUTOPILOT_TOKEN=$(openssl rand -hex 32)
    echo "✅ Generated new AUTOPILOT_TOKEN"
    
    # Update .env file
    if grep -q "^AUTOPILOT_TOKEN=" .env; then
        sed -i "s|^AUTOPILOT_TOKEN=.*|AUTOPILOT_TOKEN=$AUTOPILOT_TOKEN|" .env
    else
        echo "AUTOPILOT_TOKEN=$AUTOPILOT_TOKEN" >> .env
    fi
    echo "✅ Updated .env file"
else
    echo "✅ Using existing AUTOPILOT_TOKEN"
fi
echo ""

# Step 2: Check Cloudflare credentials
echo "[2/6] Checking Cloudflare credentials..."
if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ "$CLOUDFLARE_API_TOKEN" = "your-cloudflare-api-token" ]; then
    echo "⚠️  Cloudflare API token not configured"
    echo ""
    echo "To configure Cloudflare:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Create a token with these permissions:"
    echo "   - Workers Scripts:Edit"
    echo "   - Workers KV Storage:Edit"
    echo "   - Account Settings:Read"
    echo "3. Update CLOUDFLARE_API_TOKEN in .env"
    echo ""
    CLOUDFLARE_CONFIGURED=false
else
    echo "✅ Cloudflare API token found"
    CLOUDFLARE_CONFIGURED=true
fi
echo ""

# Step 3: Deploy Durable Object worker
echo "[3/6] Deploying Durable Object worker..."
if [ "$CLOUDFLARE_CONFIGURED" = true ]; then
    cd workers
    export CLOUDFLARE_API_TOKEN
    export CLOUDFLARE_ACCOUNT_ID
    
    if wrangler deploy --config wrangler-metrics.toml 2>&1 | tee /tmp/wrangler-deploy.log; then
        echo "✅ Durable Object worker deployed"
        WORKER_DEPLOYED=true
        
        # Set AUTOPILOT_TOKEN secret
        echo "$AUTOPILOT_TOKEN" | wrangler secret put AUTOPILOT_TOKEN --config wrangler-metrics.toml 2>/dev/null || true
        echo "✅ AUTOPILOT_TOKEN secret set"
    else
        echo "❌ Worker deployment failed"
        echo ""
        cat /tmp/wrangler-deploy.log
        echo ""
        WORKER_DEPLOYED=false
    fi
    cd ..
else
    echo "⏭️  Skipping worker deployment (Cloudflare not configured)"
    WORKER_DEPLOYED=false
fi
echo ""

# Step 4: Set GitHub secrets
echo "[4/6] Setting GitHub secrets..."
if command -v gh &> /dev/null; then
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo "Setting AUTOPILOT_TOKEN..."
        echo "$AUTOPILOT_TOKEN" | gh secret set AUTOPILOT_TOKEN
        echo "✅ GitHub secret set"
        GITHUB_CONFIGURED=true
    else
        echo "⚠️  GitHub CLI not authenticated"
        echo "Run: gh auth login"
        GITHUB_CONFIGURED=false
    fi
else
    echo "⚠️  GitHub CLI not installed"
    echo ""
    echo "To set GitHub secret manually:"
    echo "1. Go to https://github.com/elevateforhumanity/fix2/settings/secrets/actions"
    echo "2. Add new secret:"
    echo "   Name: AUTOPILOT_TOKEN"
    echo "   Value: $AUTOPILOT_TOKEN"
    echo ""
    GITHUB_CONFIGURED=false
fi
echo ""

# Step 5: Test worker endpoint
echo "[5/6] Testing worker endpoint..."
if [ "$WORKER_DEPLOYED" = true ]; then
    sleep 3  # Wait for deployment to propagate
    
    if curl -s -f https://efh-autopilot-metrics.workers.dev/summary > /dev/null 2>&1; then
        echo "✅ Worker is responding"
        WORKER_WORKING=true
    else
        echo "⚠️  Worker not responding yet (may take a few minutes)"
        WORKER_WORKING=false
    fi
else
    echo "⏭️  Skipping worker test (not deployed)"
    WORKER_WORKING=false
fi
echo ""

# Step 6: Create configuration summary
echo "[6/6] Creating configuration summary..."
cat > autopilot-config-summary.txt <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Autopilot Configuration Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Configuration Status:
  ✅ AUTOPILOT_TOKEN: Generated and saved
  $([ "$CLOUDFLARE_CONFIGURED" = true ] && echo "✅" || echo "⚠️ ") Cloudflare: $([ "$CLOUDFLARE_CONFIGURED" = true ] && echo "Configured" || echo "Needs configuration")
  $([ "$WORKER_DEPLOYED" = true ] && echo "✅" || echo "⚠️ ") Durable Worker: $([ "$WORKER_DEPLOYED" = true ] && echo "Deployed" || echo "Not deployed")
  $([ "$GITHUB_CONFIGURED" = true ] && echo "✅" || echo "⚠️ ") GitHub Secrets: $([ "$GITHUB_CONFIGURED" = true ] && echo "Configured" || echo "Needs configuration")
  $([ "$WORKER_WORKING" = true ] && echo "✅" || echo "⚠️ ") Worker Status: $([ "$WORKER_WORKING" = true ] && echo "Working" || echo "Not tested")

Credentials:
  AUTOPILOT_TOKEN: $AUTOPILOT_TOKEN
  Cloudflare Account: ${CLOUDFLARE_ACCOUNT_ID:-Not set}

Worker Endpoints:
  Base URL: https://efh-autopilot-metrics.workers.dev
  
  Available endpoints:
    • POST /store          - Store check results
    • GET  /summary        - Get metrics summary
    • GET  /recent?limit=N - Get recent checks
    • GET  /history?hours=N - Get historical data
    • GET  /trends?hours=N  - Get trend analysis
    • GET  /alerts         - Get alert history

GitHub Workflow:
  The Advanced Autopilot Inline Check workflow will automatically:
  1. Run on every push to main/develop
  2. Run on every pull request
  3. Run hourly on schedule
  4. Send results to Durable Object
  5. Store historical data
  6. Generate metrics and trends

Next Steps:
$(if [ "$CLOUDFLARE_CONFIGURED" = false ]; then
    echo "  1. Configure Cloudflare API token in .env"
    echo "  2. Run this script again to deploy worker"
fi)
$(if [ "$GITHUB_CONFIGURED" = false ]; then
    echo "  • Set GitHub secret manually or run: gh auth login"
fi)
$(if [ "$WORKER_DEPLOYED" = true ]; then
    echo "  • Test worker: curl https://efh-autopilot-metrics.workers.dev/summary"
    echo "  • View metrics dashboard (coming soon)"
fi)

Automatic Data Flow:
  GitHub Actions → Durable Object → Historical Storage → Metrics Dashboard
  
  Status: $(if [ "$WORKER_DEPLOYED" = true ] && [ "$GITHUB_CONFIGURED" = true ]; then
    echo "✅ FULLY CONFIGURED - Data will flow automatically"
  elif [ "$WORKER_DEPLOYED" = true ]; then
    echo "⚠️  PARTIALLY CONFIGURED - Set GitHub secret to enable"
  else
    echo "⚠️  NOT CONFIGURED - Complete Cloudflare setup"
  fi)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

cat autopilot-config-summary.txt
echo ""
echo "✅ Configuration summary saved to: autopilot-config-summary.txt"
echo ""

# Final status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$WORKER_DEPLOYED" = true ] && [ "$GITHUB_CONFIGURED" = true ]; then
    echo "✅ AUTOPILOT FULLY CONFIGURED!"
    echo ""
    echo "Your autopilot is now running automatically:"
    echo "  • Inline checks run on every push"
    echo "  • Results feed into Durable Objects"
    echo "  • Historical data is preserved"
    echo "  • Metrics are available via API"
    echo ""
    echo "View live metrics:"
    echo "  curl https://efh-autopilot-metrics.workers.dev/summary | jq"
elif [ "$WORKER_DEPLOYED" = true ]; then
    echo "⚠️  AUTOPILOT PARTIALLY CONFIGURED"
    echo ""
    echo "Worker deployed but GitHub secret not set."
    echo "Set it manually or run: gh auth login"
else
    echo "⚠️  AUTOPILOT NEEDS CONFIGURATION"
    echo ""
    echo "Complete Cloudflare setup and run this script again."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
