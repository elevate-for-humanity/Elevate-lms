#!/bin/bash

# Create Cloudflare API Token with Full Deployment Permissions
# This script uses the AI Employee to create a new token via the existing token

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check required variables
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "❌ CLOUDFLARE_ACCOUNT_ID not found in .env"
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN not found in .env"
  exit 1
fi

if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ VITE_SUPABASE_URL not found in .env"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_KEY not found in .env"
  exit 1
fi

echo "🚀 Creating Cloudflare API Token with Full Permissions..."
echo ""
echo "Account ID: $CLOUDFLARE_ACCOUNT_ID"
echo "Current Token: ${CLOUDFLARE_API_TOKEN:0:20}..."
echo ""

# Call the executeAction Edge Function
RESPONSE=$(curl -s -X POST \
  "${VITE_SUPABASE_URL}/functions/v1/executeAction" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"createCloudflareToken\",
    \"params\": {
      \"accountId\": \"${CLOUDFLARE_ACCOUNT_ID}\",
      \"existingToken\": \"${CLOUDFLARE_API_TOKEN}\",
      \"tokenName\": \"EFH Deployment Token - $(date +%Y-%m-%d)\"
    }
  }")

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Token created successfully!"
  echo ""
  
  # Extract the new token
  NEW_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$NEW_TOKEN" ]; then
    echo "🔑 New API Token:"
    echo "$NEW_TOKEN"
    echo ""
    echo "📝 Update your .env file:"
    echo "CLOUDFLARE_API_TOKEN=$NEW_TOKEN"
    echo ""
    echo "🎯 This token has the following permissions:"
    echo "  ✅ Workers Scripts: Edit"
    echo "  ✅ Workers KV Storage: Edit"
    echo "  ✅ Workers R2 Storage: Edit"
    echo "  ✅ Workers AI: Read"
    echo "  ✅ Account Settings: Read"
    echo ""
    echo "🚀 You can now deploy Workers with:"
    echo "  export CLOUDFLARE_API_TOKEN=$NEW_TOKEN"
    echo "  cd workers/agent && npx wrangler deploy ai-employee.js"
  else
    echo "⚠️  Token created but couldn't extract value from response"
    echo "Response: $RESPONSE"
  fi
else
  echo "❌ Failed to create token"
  echo "Response: $RESPONSE"
  exit 1
fi
