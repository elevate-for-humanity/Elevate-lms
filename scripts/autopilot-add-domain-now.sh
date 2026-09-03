#!/bin/bash
# Autopilot: Add Domain to Netlify - Direct API Call

set -e

echo "🤖 AUTOPILOT: Adding Domain to Netlify"
echo "========================================"
echo ""

DOMAIN="elevateconnectsdirectory.org"
SITE_ID="12f120ab-3f63-419b-bc49-430f043415c1"

# Check for token in multiple locations
if [ -n "$NETLIFY_AUTH_TOKEN" ]; then
    TOKEN="$NETLIFY_AUTH_TOKEN"
    echo "✅ Using NETLIFY_AUTH_TOKEN from environment"
elif [ -f ~/.netlify/config.json ]; then
    TOKEN=$(cat ~/.netlify/config.json | jq -r '.users[0].auth.token' 2>/dev/null || echo "")
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "✅ Using token from ~/.netlify/config.json"
    fi
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ No Netlify API token found"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "AUTOPILOT NEEDS YOUR HELP"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "The autopilot needs a Netlify API token to add the domain."
    echo ""
    echo "Quick steps:"
    echo "1. Open: https://app.netlify.com/user/applications"
    echo "2. Click 'New access token'"
    echo "3. Name it: 'Autopilot'"
    echo "4. Copy the token"
    echo "5. Run this command with the token:"
    echo ""
    echo "   NETLIFY_AUTH_TOKEN='paste-token-here' bash scripts/autopilot-add-domain-now.sh"
    echo ""
    echo "Or set it permanently:"
    echo "   export NETLIFY_AUTH_TOKEN='paste-token-here'"
    echo "   bash scripts/autopilot-add-domain-now.sh"
    echo ""
    exit 1
fi

echo ""
echo "Target Configuration:"
echo "  Domain: $DOMAIN"
echo "  Site ID: $SITE_ID"
echo ""

# Add the domain
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ADDING DOMAIN TO NETLIFY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"domain_name\":\"$DOMAIN\"}" \
  "https://api.netlify.com/api/v1/sites/$SITE_ID/domains")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS! Domain added to Netlify"
    echo ""
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
elif [ "$HTTP_CODE" = "422" ]; then
    if echo "$BODY" | grep -q "already"; then
        echo "✅ Domain already added (that's OK!)"
        echo ""
        echo "Response:"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        echo ""
    else
        echo "❌ Error 422:"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        echo ""
        exit 1
    fi
else
    echo "❌ Failed to add domain"
    echo ""
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    exit 1
fi

# Check SSL status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECKING SSL STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 3

SITE_INFO=$(curl -s \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.netlify.com/api/v1/sites/$SITE_ID")

echo "Domain Configuration:"
echo "$SITE_INFO" | jq '{custom_domain, domain_aliases, ssl, ssl_url, force_ssl}' 2>/dev/null || echo "Could not parse response"
echo ""

# Trigger rebuild
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TRIGGERING CACHE-CLEARING REBUILD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BUILD_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clear_cache":true}' \
  "https://api.netlify.com/api/v1/sites/$SITE_ID/builds")

BUILD_ID=$(echo "$BUILD_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")

if [ -n "$BUILD_ID" ] && [ "$BUILD_ID" != "null" ]; then
    echo "✅ Build triggered: $BUILD_ID"
else
    echo "⚠️  Could not trigger build"
    echo "$BUILD_RESPONSE" | jq '.' 2>/dev/null || echo "$BUILD_RESPONSE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CONFIGURATION COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Domain: $DOMAIN"
echo "Status: ✅ Added to Netlify"
echo "SSL: ⏳ Provisioning (2-10 minutes)"
echo ""
echo "Next steps:"
echo "1. Wait 2-10 minutes for SSL certificate"
echo "2. Check status: bash scripts/autopilot-check-ssl.sh"
echo "3. Visit: https://$DOMAIN"
echo "4. Clear browser cache (Ctrl+Shift+R)"
echo ""
echo "Monitor progress:"
echo "  https://app.netlify.com/sites/elevateproduction/settings/domain"
echo ""
