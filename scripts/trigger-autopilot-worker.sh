#!/bin/bash
# Trigger Autopilot Worker to Add Domain to Netlify

set -e

echo "🤖 TRIGGERING AUTOPILOT WORKER"
echo "================================"
echo ""

DOMAIN="elevateconnectsdirectory.org"
WORKER_URL="https://autopilot-deploy.elevateforhumanity.workers.dev"

# Check for required environment variables
if [ -z "$AUTOPILOT_TOKEN" ]; then
    echo "❌ AUTOPILOT_TOKEN not set"
    echo ""
    echo "The autopilot worker needs authentication."
    echo ""
    echo "Set the token:"
    echo "  export AUTOPILOT_TOKEN='your-autopilot-token'"
    echo ""
    exit 1
fi

echo "Target: $DOMAIN"
echo "Worker: $WORKER_URL"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK: Configure Netlify Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trigger the worker
echo "Sending request to autopilot worker..."

RESPONSE=$(curl -s -X POST "$WORKER_URL" \
  -H "Authorization: Bearer $AUTOPILOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"task\": \"configure_netlify\",
    \"data\": {
      \"domain\": \"$DOMAIN\"
    }
  }")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Autopilot worker executed successfully!"
    echo ""
    
    # Parse results
    if echo "$RESPONSE" | jq -e '.result.steps[]' > /dev/null 2>&1; then
        echo "Steps completed:"
        echo "$RESPONSE" | jq -r '.result.steps[] | "  \(.step): \(.status)"'
        echo ""
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "NEXT STEPS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Wait 2-10 minutes for SSL certificate provisioning"
    echo "2. Check SSL status:"
    echo "   bash scripts/autopilot-check-ssl.sh"
    echo ""
    echo "3. Once SSL is ready, visit:"
    echo "   https://$DOMAIN"
    echo ""
else
    echo "❌ Autopilot worker failed"
    echo ""
    
    # Check for specific errors
    if echo "$RESPONSE" | grep -q "Unauthorized"; then
        echo "Error: Invalid AUTOPILOT_TOKEN"
        echo "Get the correct token and try again"
    elif echo "$RESPONSE" | grep -q "Unknown task"; then
        echo "Error: Worker doesn't support this task yet"
        echo "The worker may need to be redeployed with the new code"
    else
        echo "Error details:"
        echo "$RESPONSE" | jq '.error' 2>/dev/null || echo "$RESPONSE"
    fi
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "FALLBACK: Manual Configuration"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "If the worker isn't working, add domain manually:"
    echo "1. Go to: https://app.netlify.com/sites/elevateproduction/settings/domain"
    echo "2. Click 'Add domain alias'"
    echo "3. Enter: $DOMAIN"
    echo "4. Click 'Add domain'"
    echo ""
    
    exit 1
fi
