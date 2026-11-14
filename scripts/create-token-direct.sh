#!/bin/bash

# Create Cloudflare API Token Directly via Cloudflare API
# This bypasses the Edge Function and calls Cloudflare directly

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

echo "🚀 Creating Cloudflare API Token with Full Permissions..."
echo ""
echo "Account ID: $CLOUDFLARE_ACCOUNT_ID"
echo "Current Token: ${CLOUDFLARE_API_TOKEN:0:20}..."
echo ""

# Create token payload
TOKEN_NAME="EFH Deployment Token - $(date +%Y-%m-%d)"

# Call Cloudflare API directly
RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/user/tokens" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${TOKEN_NAME}\",
    \"policies\": [
      {
        \"effect\": \"allow\",
        \"resources\": {
          \"com.cloudflare.api.account.${CLOUDFLARE_ACCOUNT_ID}\": \"*\"
        },
        \"permission_groups\": [
          {
            \"id\": \"c8fed203ed3043cba015a93ad1616f1f\",
            \"name\": \"Workers Scripts Write\"
          },
          {
            \"id\": \"f7f0eda5697f475c90846e879bab8666\",
            \"name\": \"Workers KV Storage Write\"
          },
          {
            \"id\": \"e086da7e2179491d91ee5f35b3ca210a\",
            \"name\": \"Workers R2 Storage Write\"
          },
          {
            \"id\": \"4755a26eedb94da69e1066d98aa820be\",
            \"name\": \"Workers AI Read\"
          },
          {
            \"id\": \"82e64a83756745bbbb1c9c2701bf816b\",
            \"name\": \"Account Settings Read\"
          }
        ]
      }
    ]
  }")

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Token created successfully!"
  echo ""
  
  # Extract the new token
  NEW_TOKEN=$(echo "$RESPONSE" | jq -r '.result.value')
  
  if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
    echo "🔑 New API Token:"
    echo "$NEW_TOKEN"
    echo ""
    echo "📝 To use this token, update your .env file:"
    echo "CLOUDFLARE_API_TOKEN=$NEW_TOKEN"
    echo ""
    echo "Or export it for immediate use:"
    echo "export CLOUDFLARE_API_TOKEN=$NEW_TOKEN"
    echo ""
    echo "🎯 This token has the following permissions:"
    echo "  ✅ Workers Scripts: Edit"
    echo "  ✅ Workers KV Storage: Edit"
    echo "  ✅ Workers R2 Storage: Edit"
    echo "  ✅ Workers AI: Read"
    echo "  ✅ Account Settings: Read"
    echo ""
    echo "🚀 You can now deploy Workers!"
  else
    echo "⚠️  Token created but couldn't extract value from response"
    echo "Full response:"
    echo "$RESPONSE" | jq '.'
  fi
else
  echo "❌ Failed to create token"
  echo "Response:"
  echo "$RESPONSE" | jq '.'
  
  # Check if it's a permission error
  if echo "$RESPONSE" | grep -q "10000"; then
    echo ""
    echo "💡 The current token doesn't have permission to create new tokens."
    echo "You'll need to:"
    echo "1. Go to https://dash.cloudflare.com/${CLOUDFLARE_ACCOUNT_ID}/api-tokens"
    echo "2. Create a new token manually with the required permissions"
    echo "3. Or update the existing token to include 'User API Tokens: Edit' permission"
  fi
  
  exit 1
fi
