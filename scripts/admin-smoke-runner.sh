#!/usr/bin/env bash
# Admin route smoke runner
# Hits every /admin route unauthenticated and records HTTP status.
# Expected behavior: pages either redirect to login OR render with error boundary
# (since admin pages require auth, server components will fail on supabase.auth.getUser()).
#
# What we're actually testing:
# 1. Route exists and compiles (not 404)
# 2. No build/import errors (not a raw 500 with no error boundary)
# 3. Error boundary catches auth failures gracefully
#
# Output: scripts/admin-smoke-results.json

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
RESULTS_FILE="scripts/admin-smoke-results.json"

# Extract routes from inventory
ROUTES=$(python3 -c "
import json
with open('scripts/admin-route-inventory.json') as f:
    inv = json.load(f)
for e in inv:
    route = e['route']
    if '[' in route:
        continue
    print(route)
")

TOTAL=$(echo "$ROUTES" | wc -l | tr -d ' ')
echo "Smoke testing $TOTAL static admin routes against $BASE_URL"
echo "Skipping dynamic [param] routes (need real IDs)"
echo ""

# Initialize results
echo "[" > "$RESULTS_FILE"
FIRST=true
COUNT=0
COMPILE_OK=0
NOT_FOUND=0
RAW_500=0
REDIRECT=0
TIMEOUT=0

while IFS= read -r route; do
    COUNT=$((COUNT + 1))
    
    HTTP_STATUS=$(curl -s -o /tmp/smoke_body.html -w "%{http_code}" \
        --max-time 30 \
        --connect-timeout 5 \
        "${BASE_URL}${route}" 2>/dev/null || echo "000")
    
    BODY_SIZE=$(wc -c < /tmp/smoke_body.html 2>/dev/null || echo 0)
    
    # Classify result
    if [ "$HTTP_STATUS" = "000" ]; then
        RESULT="TIMEOUT"
        TIMEOUT=$((TIMEOUT + 1))
    elif [ "$HTTP_STATUS" = "404" ]; then
        RESULT="NOT_FOUND"
        NOT_FOUND=$((NOT_FOUND + 1))
    elif [ "$HTTP_STATUS" = "302" ] || [ "$HTTP_STATUS" = "307" ] || [ "$HTTP_STATUS" = "308" ]; then
        RESULT="REDIRECT"
        REDIRECT=$((REDIRECT + 1))
    elif [ "$HTTP_STATUS" = "500" ]; then
        # Raw 500 = no error boundary caught it
        RESULT="RAW_500"
        RAW_500=$((RAW_500 + 1))
    elif [ "$HTTP_STATUS" = "200" ]; then
        # 200 = page compiled and rendered (even if error boundary caught an auth error)
        # Check for MODULE_NOT_FOUND or build errors
        HAS_BUILD_ERROR=$(grep -c "MODULE_NOT_FOUND\|Cannot find module\|SyntaxError\|TypeError.*is not a function" /tmp/smoke_body.html 2>/dev/null || true)
        if [ "${HAS_BUILD_ERROR:-0}" -gt 0 ]; then
            RESULT="BUILD_ERROR"
            RAW_500=$((RAW_500 + 1))
        else
            RESULT="COMPILES_OK"
            COMPILE_OK=$((COMPILE_OK + 1))
        fi
    else
        RESULT="HTTP_${HTTP_STATUS}"
        RAW_500=$((RAW_500 + 1))
    fi
    
    printf "[%3d/%d] %s %-12s %s\n" "$COUNT" "$TOTAL" "$HTTP_STATUS" "$RESULT" "$route"
    
    if [ "$FIRST" = true ]; then
        FIRST=false
    else
        echo "," >> "$RESULTS_FILE"
    fi
    printf '  {"route": "%s", "http_status": %s, "result": "%s", "body_size": %s}' \
        "$route" "$HTTP_STATUS" "$RESULT" "${BODY_SIZE:-0}" >> "$RESULTS_FILE"
    
done <<< "$ROUTES"

echo "" >> "$RESULTS_FILE"
echo "]" >> "$RESULTS_FILE"

echo ""
echo "=== Smoke Test Summary ==="
echo "Total routes tested: $COUNT"
echo "Compiles OK (200):   $COMPILE_OK"
echo "Redirects:           $REDIRECT"
echo "Not Found (404):     $NOT_FOUND"
echo "Raw 500/Build Error: $RAW_500"
echo "Timeout:             $TIMEOUT"
echo ""
echo "Results: $RESULTS_FILE"

rm -f /tmp/smoke_body.html
