#!/bin/bash
# Autopilot: Add Custom Domain to Netlify
# Automatically adds elevateconnectsdirectory.org to Netlify and configures SSL

set -e

echo "🤖 AUTOPILOT: Add Custom Domain to Netlify"
echo "==========================================="
echo ""

# Configuration
SITE_ID="12f120ab-3f63-419b-bc49-430f043415c1"
DOMAIN="elevateconnectsdirectory.org"

# Check if NETLIFY_AUTH_TOKEN is set
if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
    echo "❌ NETLIFY_AUTH_TOKEN environment variable not set"
    echo ""
    echo "To set it:"
    echo "1. Go to: https://app.netlify.com/user/applications"
    echo "2. Create a new personal access token"
    echo "3. Run: export NETLIFY_AUTH_TOKEN='your-token-here'"
    echo ""
    echo "Or run this script with the token:"
    echo "NETLIFY_AUTH_TOKEN='your-token' bash scripts/autopilot-add-domain.sh"
    exit 1
fi

echo "📋 Configuration:"
echo "   Site ID: $SITE_ID"
echo "   Domain: $DOMAIN"
echo ""

# Step 1: Check current domains
echo "1️⃣  Checking current domains..."
CURRENT_DOMAINS=$(curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/sites/$SITE_ID" | \
    jq -r '.domain_aliases[]? // empty' 2>/dev/null || echo "")

if echo "$CURRENT_DOMAINS" | grep -q "$DOMAIN"; then
    echo "✅ Domain already added: $DOMAIN"
    DOMAIN_EXISTS=true
else
    echo "⏳ Domain not yet added: $DOMAIN"
    DOMAIN_EXISTS=false
fi
echo ""

# Step 2: Add domain if not exists
if [ "$DOMAIN_EXISTS" = false ]; then
    echo "2️⃣  Adding custom domain..."
    
    ADD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"domain_name\":\"$DOMAIN\"}" \
        "https://api.netlify.com/api/v1/sites/$SITE_ID/domains")
    
    HTTP_CODE=$(echo "$ADD_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$ADD_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Domain added successfully"
        echo "   Response: $RESPONSE_BODY"
    elif [ "$HTTP_CODE" = "422" ]; then
        echo "⚠️  Domain might already exist (422 error)"
        echo "   Response: $RESPONSE_BODY"
    else
        echo "❌ Failed to add domain (HTTP $HTTP_CODE)"
        echo "   Response: $RESPONSE_BODY"
        exit 1
    fi
else
    echo "2️⃣  Skipping domain addition (already exists)"
fi
echo ""

# Step 3: Check SSL status
echo "3️⃣  Checking SSL certificate status..."
SSL_INFO=$(curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/sites/$SITE_ID" | \
    jq -r '{ssl: .ssl, ssl_url: .ssl_url, force_ssl: .force_ssl}' 2>/dev/null || echo "{}")

echo "   SSL Info: $SSL_INFO"

SSL_ENABLED=$(echo "$SSL_INFO" | jq -r '.ssl' 2>/dev/null || echo "false")

if [ "$SSL_ENABLED" = "true" ]; then
    echo "✅ SSL is enabled"
else
    echo "⏳ SSL provisioning in progress (this takes 2-10 minutes)"
    echo "   Netlify will automatically provision a Let's Encrypt certificate"
fi
echo ""

# Step 4: Trigger cache clear
echo "4️⃣  Triggering cache clear and rebuild..."
BUILD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"clear_cache":true}' \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/builds")

BUILD_HTTP_CODE=$(echo "$BUILD_RESPONSE" | tail -n1)
BUILD_BODY=$(echo "$BUILD_RESPONSE" | sed '$d')

if [ "$BUILD_HTTP_CODE" = "200" ] || [ "$BUILD_HTTP_CODE" = "201" ]; then
    BUILD_ID=$(echo "$BUILD_BODY" | jq -r '.id' 2>/dev/null || echo "unknown")
    echo "✅ Build triggered successfully"
    echo "   Build ID: $BUILD_ID"
else
    echo "⚠️  Failed to trigger build (HTTP $BUILD_HTTP_CODE)"
    echo "   Response: $BUILD_BODY"
fi
echo ""

# Step 5: Summary
echo "📊 SUMMARY"
echo "=========="
echo ""
echo "Domain: $DOMAIN"
echo "Status: Added to Netlify ✅"
echo ""
echo "SSL Certificate:"
if [ "$SSL_ENABLED" = "true" ]; then
    echo "  Status: ✅ Active"
    echo "  URL: https://$DOMAIN"
else
    echo "  Status: ⏳ Provisioning (2-10 minutes)"
    echo "  URL: Will be https://$DOMAIN when ready"
fi
echo ""
echo "Next Steps:"
echo "1. Wait 2-10 minutes for SSL certificate provisioning"
echo "2. Check status: https://app.netlify.com/sites/elevateproduction/settings/domain"
echo "3. Test site: https://$DOMAIN"
echo "4. Clear browser cache if needed (Ctrl+Shift+R)"
echo ""
echo "Monitor SSL provisioning:"
echo "  bash scripts/autopilot-check-ssl.sh"
echo ""
echo "✅ AUTOPILOT COMPLETE"
