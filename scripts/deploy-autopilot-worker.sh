#!/bin/bash
# Deploy Autopilot Worker to Cloudflare

set -e

echo "🚀 DEPLOYING AUTOPILOT WORKER"
echo "=============================="
echo ""

cd workers

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

echo "✅ Wrangler installed"
echo ""

# Check if logged in
echo "Checking Cloudflare authentication..."
if ! wrangler whoami 2>&1 | grep -q "You are logged in"; then
    echo "⚠️  Not logged in to Cloudflare"
    echo ""
    echo "Please login:"
    echo "  wrangler login"
    echo ""
    echo "Or set API token:"
    echo "  export CLOUDFLARE_API_TOKEN='your-token'"
    echo ""
    exit 1
fi

echo "✅ Authenticated with Cloudflare"
echo ""

# Deploy the worker
echo "Deploying autopilot-deploy-worker..."
wrangler deploy

echo ""
echo "✅ Worker deployed successfully!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "NEXT: Set Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "The worker needs these secrets:"
echo ""
echo "1. AUTOPILOT_TOKEN:"
echo "   wrangler secret put AUTOPILOT_TOKEN"
echo ""
echo "2. NETLIFY_TOKEN:"
echo "   Get from: https://app.netlify.com/user/applications"
echo "   wrangler secret put NETLIFY_TOKEN"
echo ""
echo "3. NETLIFY_SITE_ID:"
echo "   wrangler secret put NETLIFY_SITE_ID"
echo "   Value: 12f120ab-3f63-419b-bc49-430f043415c1"
echo ""
echo "4. GITHUB_TOKEN (optional):"
echo "   wrangler secret put GITHUB_TOKEN"
echo ""
echo "5. SUPABASE_URL:"
echo "   wrangler secret put SUPABASE_URL"
echo "   Value: https://cuxzzpsyufcewtmicszk.supabase.co"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "USAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After setting secrets, trigger the worker:"
echo "  export AUTOPILOT_TOKEN='your-token'"
echo "  bash scripts/trigger-autopilot-worker.sh"
echo ""
echo "Or call directly:"
echo "  curl -X POST https://autopilot-deploy.YOUR_SUBDOMAIN.workers.dev \\"
echo "    -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"task\":\"configure_netlify\",\"data\":{\"domain\":\"elevateconnectsdirectory.org\"}}'"
echo ""
