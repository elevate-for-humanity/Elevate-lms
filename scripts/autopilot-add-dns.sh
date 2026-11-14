#!/bin/bash
# Autopilot DNS Setup for portal.elevateforhumanity.org
# This script automatically adds the CNAME record to Cloudflare

set -e

echo "🚀 Autopilot DNS Setup"
echo "======================"
echo ""

# Check for required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN not set"
    echo "Get your API token from: https://dash.cloudflare.com/profile/api-tokens"
    echo "Then run: export CLOUDFLARE_API_TOKEN=your-token"
    exit 1
fi

# Configuration
DOMAIN="elevateforhumanity.org"
SUBDOMAIN="portal"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
TARGET="elevateforhumanityfix2.netlify.app"

echo "📋 Configuration:"
echo "   Domain: $DOMAIN"
echo "   Subdomain: $SUBDOMAIN"
echo "   Full domain: $FULL_DOMAIN"
echo "   Target: $TARGET"
echo ""

# Step 1: Get Zone ID
echo "🔍 Step 1: Getting Cloudflare Zone ID..."
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo $ZONE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
    echo "❌ Error: Could not find zone for $DOMAIN"
    echo "Response: $ZONE_RESPONSE"
    exit 1
fi

echo "✅ Zone ID: $ZONE_ID"
echo ""

# Step 2: Check if DNS record already exists
echo "🔍 Step 2: Checking for existing DNS record..."
EXISTING_RECORD=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$FULL_DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

RECORD_ID=$(echo $EXISTING_RECORD | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$RECORD_ID" ]; then
    echo "⚠️  DNS record already exists (ID: $RECORD_ID)"
    echo "   Updating existing record..."
    
    # Update existing record
    UPDATE_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{
        \"type\": \"CNAME\",
        \"name\": \"$SUBDOMAIN\",
        \"content\": \"$TARGET\",
        \"ttl\": 3600,
        \"proxied\": false
      }")
    
    SUCCESS=$(echo $UPDATE_RESPONSE | grep -o '"success":true')
    
    if [ ! -z "$SUCCESS" ]; then
        echo "✅ DNS record updated successfully!"
    else
        echo "❌ Error updating DNS record"
        echo "Response: $UPDATE_RESPONSE"
        exit 1
    fi
else
    echo "📝 No existing record found. Creating new record..."
    
    # Create new record
    CREATE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{
        \"type\": \"CNAME\",
        \"name\": \"$SUBDOMAIN\",
        \"content\": \"$TARGET\",
        \"ttl\": 3600,
        \"proxied\": false,
        \"comment\": \"Netlify portal subdomain - added by autopilot\"
      }")
    
    SUCCESS=$(echo $CREATE_RESPONSE | grep -o '"success":true')
    
    if [ ! -z "$SUCCESS" ]; then
        echo "✅ DNS record created successfully!"
    else
        echo "❌ Error creating DNS record"
        echo "Response: $CREATE_RESPONSE"
        exit 1
    fi
fi

echo ""
echo "🎉 DNS Setup Complete!"
echo ""
echo "📊 DNS Record Details:"
echo "   Type: CNAME"
echo "   Name: $SUBDOMAIN"
echo "   Points to: $TARGET"
echo "   TTL: 3600 seconds (1 hour)"
echo ""
echo "⏱️  DNS Propagation:"
echo "   - Usually takes 5-30 minutes"
echo "   - Can take up to 48 hours in rare cases"
echo "   - Check status: https://dnschecker.org/#CNAME/$FULL_DOMAIN"
echo ""
echo "🔗 Next Steps:"
echo "   1. Wait for DNS to propagate (5-30 minutes)"
echo "   2. Add custom domain in Netlify dashboard"
echo "   3. Add environment variables in Netlify"
echo "   4. Trigger new deployment"
echo ""
echo "✅ Your portal will be live at: https://$FULL_DOMAIN"
