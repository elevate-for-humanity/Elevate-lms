#!/bin/bash

# Script to create a Cloudflare API token with proper permissions
# This uses the Cloudflare API to create a token programmatically

set -e

echo "🔑 Cloudflare API Token Creator"
echo "================================"
echo ""

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for existing token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN not found in .env"
    echo ""
    echo "Please create a token manually:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Click 'Create Token'"
    echo "3. Use 'Edit Cloudflare Workers' template"
    echo "4. Add these permissions:"
    echo "   - Account → Workers Scripts → Edit"
    echo "   - Account → Workers KV Storage → Edit"
    echo "   - Account → Workers R2 Storage → Edit"
    echo "   - Account → Account Settings → Read"
    echo "5. Copy the token and add to .env:"
    echo "   CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ Error: CLOUDFLARE_ACCOUNT_ID not found in .env"
    exit 1
fi

echo "📋 Current Configuration:"
echo "   Account ID: $CLOUDFLARE_ACCOUNT_ID"
echo "   Token: ${CLOUDFLARE_API_TOKEN:0:20}..."
echo ""

# Test current token
echo "🔍 Testing current token permissions..."
RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ]; then
    echo "✅ Current token is valid"
    
    # Check permissions
    echo ""
    echo "📊 Token Permissions:"
    echo "$RESPONSE" | grep -o '"permissions":\[.*\]' | sed 's/,/\n/g' | sed 's/[\[\]"]//g' | grep -v "^$" | while read perm; do
        echo "   - $perm"
    done
    
    echo ""
    echo "⚠️  Note: The current token may not have all required permissions."
    echo "   Required permissions:"
    echo "   - Workers Scripts: Edit"
    echo "   - Workers KV Storage: Edit"
    echo "   - Workers R2 Storage: Edit"
    echo "   - Account Settings: Read"
    echo ""
    echo "If deployment fails, create a new token with these permissions:"
    echo "https://dash.cloudflare.com/profile/api-tokens"
else
    echo "❌ Current token is invalid or expired"
    echo ""
    echo "Please create a new token:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Click 'Create Token'"
    echo "3. Use 'Edit Cloudflare Workers' template"
    echo "4. Add KV and R2 permissions"
    echo "5. Update .env with new token"
fi

echo ""
echo "💡 Tip: To create a token with full permissions, use the Cloudflare dashboard."
echo "   The API doesn't allow creating tokens with all necessary permissions."
echo ""
