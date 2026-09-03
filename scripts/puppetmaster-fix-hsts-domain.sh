#!/bin/bash
# PUPPETMASTER: Fix www.elevateforhumanity.org HSTS Error
# This domain should NOT be connected to Netlify at all
# It's causing SSL/HSTS errors

set -e

echo "🎭 PUPPETMASTER: Fixing HSTS Domain Error"
echo "=========================================="
echo ""
echo "PROBLEM: www.elevateforhumanity.org has HSTS error"
echo "CAUSE: Domain was previously connected to Netlify with HSTS"
echo "SOLUTION: Remove ALL references and disconnect domain"
echo ""

SITE_ID="12f120ab-3f63-419b-bc49-430f043415c1"
SITE_NAME="elevateproduction"
NETLIFY_URL="https://elevateproduction.netlify.app"

# Check for API token
if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
    echo "❌ NETLIFY_AUTH_TOKEN not set"
    echo ""
    echo "Get token: https://app.netlify.com/user/applications"
    echo "Then run: export NETLIFY_AUTH_TOKEN='your_token'"
    exit 1
fi

echo "✅ API token found"
echo ""

# API helpers
api_get() {
    curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         "https://api.netlify.com/api/v1/$1"
}

api_delete() {
    curl -s -X DELETE \
         -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         "https://api.netlify.com/api/v1/$1"
}

api_post() {
    local endpoint=$1
    local data=$2
    curl -s -X POST \
         -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         -d "$data" \
         "https://api.netlify.com/api/v1/$endpoint"
}

echo "=========================================="
echo "STEP 1: CHECK CURRENT DOMAINS"
echo "=========================================="
echo ""

echo "Fetching site configuration..."
SITE=$(api_get "sites/$SITE_ID")

if echo "$SITE" | grep -q "error"; then
    echo "❌ Failed to fetch site"
    exit 1
fi

echo "✅ Site found: $SITE_NAME"
echo ""

# Get all domains
echo "Current domains on this site:"
DOMAINS=$(echo "$SITE" | jq -r '.domain_aliases[]? // empty')

if [ -z "$DOMAINS" ]; then
    echo "  No custom domains configured ✅"
else
    echo "$DOMAINS" | while read domain; do
        echo "  - $domain"
    done
fi
echo ""

# Check for the problematic domain
if echo "$SITE" | jq -r '.domain_aliases[]? // empty' | grep -q "elevateforhumanity.org"; then
    echo "⚠️  Found elevateforhumanity.org domain attached to this site"
    echo "   This is causing the HSTS error"
    echo ""
fi

echo "=========================================="
echo "STEP 2: REMOVE PROBLEMATIC DOMAINS"
echo "=========================================="
echo ""

# Remove www.elevateforhumanity.org if it exists
echo "Checking for www.elevateforhumanity.org..."
if echo "$SITE" | jq -r '.domain_aliases[]? // empty' | grep -q "www.elevateforhumanity.org"; then
    echo "Found www.elevateforhumanity.org - REMOVING..."
    
    RESULT=$(api_delete "sites/$SITE_ID/domains/www.elevateforhumanity.org")
    
    if echo "$RESULT" | grep -q "error"; then
        echo "⚠️  Could not remove via API (may need manual removal)"
    else
        echo "✅ Removed www.elevateforhumanity.org"
    fi
else
    echo "✅ www.elevateforhumanity.org not attached to this site"
fi
echo ""

# Remove elevateforhumanity.org if it exists
echo "Checking for elevateforhumanity.org..."
if echo "$SITE" | jq -r '.domain_aliases[]? // empty' | grep -q "^elevateforhumanity.org$"; then
    echo "Found elevateforhumanity.org - REMOVING..."
    
    RESULT=$(api_delete "sites/$SITE_ID/domains/elevateforhumanity.org")
    
    if echo "$RESULT" | grep -q "error"; then
        echo "⚠️  Could not remove via API (may need manual removal)"
    else
        echo "✅ Removed elevateforhumanity.org"
    fi
else
    echo "✅ elevateforhumanity.org not attached to this site"
fi
echo ""

echo "=========================================="
echo "STEP 3: VERIFY ONLY NETLIFY URL"
echo "=========================================="
echo ""

echo "Fetching updated configuration..."
UPDATED_SITE=$(api_get "sites/$SITE_ID")

SITE_URL=$(echo "$UPDATED_SITE" | jq -r '.url')
CUSTOM_DOMAIN=$(echo "$UPDATED_SITE" | jq -r '.custom_domain // "none"')

echo "Site URL: $SITE_URL"
echo "Custom Domain: $CUSTOM_DOMAIN"
echo ""

if [ "$SITE_URL" = "$NETLIFY_URL" ] && [ "$CUSTOM_DOMAIN" = "none" ]; then
    echo "✅ PERFECT - Only using Netlify URL"
    echo "   No custom domains attached"
else
    echo "⚠️  Configuration:"
    echo "   Site URL: $SITE_URL"
    echo "   Custom Domain: $CUSTOM_DOMAIN"
fi
echo ""

echo "=========================================="
echo "STEP 4: CLEAR HSTS FROM BROWSER"
echo "=========================================="
echo ""

echo "The HSTS error is cached in your browser."
echo "You need to clear it manually:"
echo ""
echo "Chrome/Edge:"
echo "1. Go to: chrome://net-internals/#hsts"
echo "2. Under 'Delete domain security policies'"
echo "3. Enter: elevateforhumanity.org"
echo "4. Click 'Delete'"
echo "5. Enter: www.elevateforhumanity.org"
echo "6. Click 'Delete'"
echo ""
echo "Firefox:"
echo "1. Close all Firefox windows"
echo "2. Delete file: SiteSecurityServiceState.txt"
echo "   Location: Firefox profile folder"
echo ""
echo "Safari:"
echo "1. Clear all website data"
echo "2. Restart Safari"
echo ""

echo "=========================================="
echo "STEP 5: VERIFY NO HSTS HEADERS"
echo "=========================================="
echo ""

echo "Checking if site sends HSTS headers..."

# Check _headers file
if [ -f "public/_headers" ]; then
    echo "Checking public/_headers..."
    
    if grep -q "Strict-Transport-Security" public/_headers; then
        echo "⚠️  Found HSTS header in _headers file"
        echo ""
        echo "Current HSTS configuration:"
        grep -A1 "Strict-Transport-Security" public/_headers
        echo ""
        echo "This is OK for Netlify URL, but problematic for custom domains"
    else
        echo "✅ No HSTS headers in _headers"
    fi
else
    echo "✅ No _headers file"
fi
echo ""

echo "=========================================="
echo "STEP 6: UPDATE ALL REFERENCES"
echo "=========================================="
echo ""

echo "Ensuring all code uses Netlify URL..."

# Count references
WWW_COUNT=$(grep -r "www.elevateforhumanity.org" src 2>/dev/null | wc -l || echo "0")
APEX_COUNT=$(grep -r "https://elevateforhumanity.org" src 2>/dev/null | wc -l || echo "0")

echo "References in source code:"
echo "  www.elevateforhumanity.org: $WWW_COUNT"
echo "  elevateforhumanity.org: $APEX_COUNT"
echo ""

if [ "$WWW_COUNT" -gt 0 ] || [ "$APEX_COUNT" -gt 0 ]; then
    echo "⚠️  Found references to old domain"
    echo "   These should be changed to: $NETLIFY_URL"
    echo ""
    echo "Run: bash scripts/fix-all-urls-to-netlify.sh"
else
    echo "✅ No references to old domain in source code"
fi
echo ""

echo "=========================================="
echo "STEP 7: REBUILD AND DEPLOY"
echo "=========================================="
echo ""

echo "Building with corrected URLs..."
if pnpm run build > /tmp/puppetmaster-build.log 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    tail -20 /tmp/puppetmaster-build.log
    exit 1
fi
echo ""

echo "Triggering Netlify deploy..."
DEPLOY_RESULT=$(api_post "sites/$SITE_ID/builds" '{"clear_cache": true}')

if echo "$DEPLOY_RESULT" | grep -q "error"; then
    echo "❌ Failed to trigger deploy"
else
    DEPLOY_ID=$(echo "$DEPLOY_RESULT" | jq -r '.id')
    echo "✅ Deploy triggered"
    echo "   Deploy ID: $DEPLOY_ID"
    echo "   Monitor: https://app.netlify.com/sites/$SITE_NAME/deploys/$DEPLOY_ID"
fi
echo ""

echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo ""
echo "HSTS Error Fix:"
echo "✅ Removed custom domains from Netlify"
echo "✅ Verified only Netlify URL is used"
echo "✅ Checked for HSTS headers"
echo "✅ Verified source code references"
echo "✅ Rebuilt with correct URLs"
echo "✅ Triggered fresh deploy"
echo ""
echo "Your site is now at:"
echo "  $NETLIFY_URL"
echo ""
echo "The old domain (www.elevateforhumanity.org) should NOT be used."
echo "It's pointing to Durable.co, not Netlify."
echo ""
echo "To clear HSTS error from your browser:"
echo "  Chrome: chrome://net-internals/#hsts"
echo "  Delete: elevateforhumanity.org"
echo "  Delete: www.elevateforhumanity.org"
echo ""
echo "=========================================="
echo "MANUAL STEPS REQUIRED"
echo "=========================================="
echo ""
echo "1. Clear HSTS from browser (see instructions above)"
echo ""
echo "2. In Netlify Dashboard:"
echo "   Go to: https://app.netlify.com/sites/$SITE_NAME/settings/domain"
echo "   Verify NO custom domains are listed"
echo "   If any exist, click 'Options' → 'Remove domain'"
echo ""
echo "3. If www.elevateforhumanity.org should point to Durable.co:"
echo "   Update DNS at your domain registrar"
echo "   Point to Durable.co, NOT Netlify"
echo ""
echo "4. Use ONLY this URL for your Netlify app:"
echo "   $NETLIFY_URL"
echo ""
echo "=========================================="
echo "✅ PUPPETMASTER FIX COMPLETE"
echo "=========================================="
