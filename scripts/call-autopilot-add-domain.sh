#!/bin/bash
# Call Vercel Autopilot Worker to add domain

WORKER_URL="https://vercel-autopilot.elevateforhumanity.workers.dev"
AUTOPILOT_TOKEN="${AUTOPILOT_TOKEN:-your-autopilot-token}"

echo "🤖 Calling Vercel Autopilot Worker"
echo "   Worker URL: $WORKER_URL"
echo ""

# Add www.elevateforhumanity.org
echo "📍 Adding www.elevateforhumanity.org..."
curl -X POST "$WORKER_URL" \
  -H "Authorization: Bearer $AUTOPILOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "add_domain",
    "data": {
      "domain": "www.elevateforhumanity.org"
    }
  }' | jq '.'

echo ""
echo "📍 Adding elevateforhumanity.org (root with redirect)..."
curl -X POST "$WORKER_URL" \
  -H "Authorization: Bearer $AUTOPILOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "add_domain",
    "data": {
      "domain": "elevateforhumanity.org"
    }
  }' | jq '.'

echo ""
echo "📋 Checking domain status..."
curl -X POST "$WORKER_URL" \
  -H "Authorization: Bearer $AUTOPILOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "check_domain",
    "data": {
      "domain": "www.elevateforhumanity.org"
    }
  }' | jq '.'

echo ""
echo "🚀 Triggering deployment..."
curl -X POST "$WORKER_URL" \
  -H "Authorization: Bearer $AUTOPILOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "trigger_deploy",
    "data": {}
  }' | jq '.'

echo ""
echo "✅ Autopilot commands sent!"
echo "   Check www.elevateforhumanity.org in 2-3 minutes"
