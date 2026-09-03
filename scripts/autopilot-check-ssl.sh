#!/bin/bash
# Autopilot: Check SSL Certificate Status
# Monitors SSL provisioning for elevateconnectsdirectory.org

set -e

DOMAIN="elevateconnectsdirectory.org"
SITE_ID="12f120ab-3f63-419b-bc49-430f043415c1"

echo "🔒 Checking SSL Certificate Status"
echo "===================================="
echo ""
echo "Domain: $DOMAIN"
echo ""

# Check DNS
echo "1️⃣  DNS Configuration:"
DNS_IP=$(curl -s "https://dns.google/resolve?name=$DOMAIN&type=A" | jq -r '.Answer[0].data' 2>/dev/null || echo "unknown")
echo "   $DOMAIN → $DNS_IP"

if [ "$DNS_IP" = "75.2.60.5" ]; then
    echo "   ✅ DNS pointing to Netlify correctly"
else
    echo "   ⚠️  DNS not pointing to Netlify (expected 75.2.60.5)"
fi
echo ""

# Check SSL certificate
echo "2️⃣  SSL Certificate:"
SSL_CHECK=$(curl -Ivks "https://$DOMAIN" 2>&1 || true)

if echo "$SSL_CHECK" | grep -q "CN=$DOMAIN"; then
    echo "   ✅ Valid SSL certificate for $DOMAIN"
    CERT_SUBJECT=$(echo "$SSL_CHECK" | grep "subject:" | head -1)
    CERT_ISSUER=$(echo "$SSL_CHECK" | grep "issuer:" | head -1)
    echo "   $CERT_SUBJECT"
    echo "   $CERT_ISSUER"
elif echo "$SSL_CHECK" | grep -q "CN=\*.netlify.app"; then
    echo "   ⏳ Still using *.netlify.app certificate"
    echo "   SSL provisioning in progress..."
else
    echo "   ❌ SSL certificate issue"
    echo "$SSL_CHECK" | grep -E "subject:|issuer:" | head -2
fi
echo ""

# Check HTTP response
echo "3️⃣  HTTP Response:"
HTTP_CODE=$(curl -Iks "https://$DOMAIN" 2>&1 | grep "HTTP" | head -1 || echo "Connection failed")
echo "   $HTTP_CODE"

if echo "$HTTP_CODE" | grep -q "200"; then
    echo "   ✅ Site is accessible"
elif echo "$HTTP_CODE" | grep -q "Connection failed"; then
    echo "   ⏳ SSL handshake in progress or certificate mismatch"
else
    echo "   ⚠️  Unexpected response"
fi
echo ""

# Check Netlify API if token is available
if [ -n "$NETLIFY_AUTH_TOKEN" ]; then
    echo "4️⃣  Netlify Configuration:"
    NETLIFY_INFO=$(curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
        "https://api.netlify.com/api/v1/sites/$SITE_ID" 2>/dev/null || echo "{}")
    
    DOMAIN_ALIASES=$(echo "$NETLIFY_INFO" | jq -r '.domain_aliases[]?' 2>/dev/null || echo "")
    SSL_ENABLED=$(echo "$NETLIFY_INFO" | jq -r '.ssl' 2>/dev/null || echo "unknown")
    SSL_URL=$(echo "$NETLIFY_INFO" | jq -r '.ssl_url' 2>/dev/null || echo "unknown")
    
    echo "   Domain aliases:"
    if [ -n "$DOMAIN_ALIASES" ]; then
        echo "$DOMAIN_ALIASES" | while read -r alias; do
            if [ "$alias" = "$DOMAIN" ]; then
                echo "     ✅ $alias"
            else
                echo "     - $alias"
            fi
        done
    else
        echo "     (none)"
    fi
    
    echo "   SSL enabled: $SSL_ENABLED"
    echo "   SSL URL: $SSL_URL"
    echo ""
fi

# Summary
echo "📊 SUMMARY"
echo "=========="
echo ""

# Determine overall status
if echo "$SSL_CHECK" | grep -q "CN=$DOMAIN" && echo "$HTTP_CODE" | grep -q "200"; then
    echo "✅ FULLY CONFIGURED"
    echo ""
    echo "Your site is live at: https://$DOMAIN"
    echo "SSL certificate is valid and active"
    echo ""
    echo "Next steps:"
    echo "1. Clear your browser cache (Ctrl+Shift+R)"
    echo "2. Visit: https://$DOMAIN"
    echo "3. Verify all styling and images load correctly"
elif echo "$SSL_CHECK" | grep -q "CN=\*.netlify.app"; then
    echo "⏳ SSL PROVISIONING IN PROGRESS"
    echo ""
    echo "Domain is added to Netlify, but SSL certificate is still being provisioned."
    echo "This typically takes 2-10 minutes."
    echo ""
    echo "Current status:"
    echo "  - Domain added: ✅"
    echo "  - DNS configured: ✅"
    echo "  - SSL certificate: ⏳ Provisioning..."
    echo ""
    echo "Check again in a few minutes:"
    echo "  bash scripts/autopilot-check-ssl.sh"
else
    echo "❌ CONFIGURATION NEEDED"
    echo ""
    echo "The domain may not be added to Netlify yet."
    echo ""
    echo "To add the domain:"
    echo "  NETLIFY_AUTH_TOKEN='your-token' bash scripts/autopilot-add-domain.sh"
    echo ""
    echo "Or manually:"
    echo "  https://app.netlify.com/sites/elevateproduction/settings/domain"
fi
echo ""
