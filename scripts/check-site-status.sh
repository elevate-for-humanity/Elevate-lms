#!/bin/bash
# Check if the production site is responding

PRODUCTION_URL="https://www.elevateforhumanity.org"
MAX_ATTEMPTS=60
ATTEMPT=0

echo "🔍 Checking production site status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 URL: $PRODUCTION_URL"
echo ""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    TIMESTAMP=$(date +"%H:%M:%S")
    
    echo "[$TIMESTAMP] Attempt $ATTEMPT/$MAX_ATTEMPTS"
    
    # Check HTTP status
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" --max-time 10)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "  ✅ Status: $HTTP_CODE (OK)"
        
        # Check if page contains expected content
        CONTENT=$(curl -s "$PRODUCTION_URL" --max-time 10)
        
        if echo "$CONTENT" | grep -q "Elevate For Humanity"; then
            echo "  ✅ Content: Site is loading correctly"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "✅ SITE IS LIVE AND WORKING!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "🌐 Visit: $PRODUCTION_URL"
            echo "⏱️  Total time: $((ATTEMPT * 10)) seconds"
            echo ""
            exit 0
        else
            echo "  ⚠️  Content: Page loaded but content may be incorrect"
        fi
    elif [ "$HTTP_CODE" = "000" ]; then
        echo "  ❌ Status: Connection failed (timeout or DNS issue)"
    else
        echo "  ⚠️  Status: $HTTP_CODE"
    fi
    
    echo "  ⏳ Waiting 10 seconds before retry..."
    echo ""
    sleep 10
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏱️  TIMEOUT: Site did not respond successfully in $((MAX_ATTEMPTS * 10)) seconds"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Manual check: $PRODUCTION_URL"
exit 1
