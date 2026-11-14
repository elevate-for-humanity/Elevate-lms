#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${1:-https://www.elevateforhumanity.org}"

echo "🔍 Verifying Elevate LMS deployment at: $SITE_URL"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

failed=0

echo "=== 1. API Version Endpoint ==="
version_response=$(curl -s "$SITE_URL/api/version" || echo "")
if echo "$version_response" | grep -q '"service"'; then
  echo -e "${GREEN}  ✓ /api/version returns JSON${NC}"
  echo "$version_response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"  Service: {d.get('service','?')}\"); print(f\"  Commit: {d.get('commit','?')}\"); print(f\"  Git SHA: {d.get('gitSha','?')}\"); print(f\"  Build ID: {d.get('buildId','?')}\")"
else
  echo -e "${RED}  ✗ /api/version not working${NC}"
  ((failed++))
fi

echo ""
echo "=== 2. Health Check ==="
health=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/api/health" || echo "000")
if [ "$health" = "200" ] || [ "$health" = "503" ]; then
  echo -e "${GREEN}  ✓ Health endpoint responding ($health)${NC}"
else
  echo -e "${RED}  ✗ Health check failed ($health)${NC}"
  ((failed++))
fi

echo ""
echo "=== 3. Route Redirects ==="
# /terms should redirect to /terms-of-service
redirect=$(curl -s -o /dev/null -w "%{redirect_url}" "$SITE_URL/terms" || echo "")
if echo "$redirect" | grep -q "terms-of-service"; then
  echo -e "${GREEN}  ✓ /terms redirects to /terms-of-service${NC}"
else
  echo -e "${RED}  ✗ /terms redirect failed (got: $redirect)${NC}"
  ((failed++))
fi

# /accessibility/accessibility should redirect to /accessibility
redirect=$(curl -s -o /dev/null -w "%{redirect_url}" "$SITE_URL/accessibility/accessibility" || echo "")
if echo "$redirect" | grep -q "accessibility"; then
  echo -e "${GREEN}  ✓ /accessibility/accessibility redirects to /accessibility${NC}"
else
  echo -e "${RED}  ✗ /accessibility/accessibility redirect failed${NC}"
  ((failed++))
fi

echo ""
echo "=== 4. Non-www to www Redirect ==="
redirect=$(curl -s -o /dev/null -w "%{redirect_url}" "https://elevateforhumanity.org/" 2>/dev/null || echo "")
if echo "$redirect" | grep -q "www.elevateforhumanity.org"; then
  echo -e "${GREEN}  ✓ Non-www redirects to www${NC}"
else
  echo -e "${YELLOW}  ⚠ Non-www redirect not detected (may be configured elsewhere)${NC}"
fi

echo ""
echo "=== 5. Core Pages ==="
pages=(
  "/:Homepage"
  "/terms-of-service:Terms"
  "/accessibility:Accessibility"
  "/programs:Programs"
  "/testing:Testing"
  "/funding:Funding"
  "/store:Store"
  "/about:About"
)
for page in "${pages[@]}"; do
  route="${page%%:*}"
  name="${page##*:}"
  status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL$route" || echo "000")
  if [ "$status" = "200" ]; then
    echo -e "${GREEN}  ✓ $name ($route)${NC}"
  else
    echo -e "${RED}  ✗ $name ($route) - $status${NC}"
    ((failed++))
  fi
done

echo ""
echo "=== 6. Admin Portal ==="
admin_status=$(curl -s -o /dev/null -w "%{http_code}" "https://admin.elevateforhumanity.org/" || echo "000")
if [ "$admin_status" = "200" ]; then
  echo -e "${GREEN}  ✓ Admin portal accessible${NC}"
else
  echo -e "${YELLOW}  ⚠ Admin portal returned $admin_status${NC}"
fi

echo ""
echo "=== 7. App Portal ==="
app_status=$(curl -s -o /dev/null -w "%{http_code}" "https://app.elevateforhumanity.org/" || echo "000")
if [ "$app_status" = "200" ]; then
  echo -e "${GREEN}  ✓ App portal accessible${NC}"
else
  echo -e "${YELLOW}  ⚠ App portal returned $app_status${NC}"
fi

echo ""
echo "=========================================="
if [ $failed -eq 0 ]; then
  echo -e "${GREEN}✅ All critical tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ $failed test(s) failed${NC}"
  exit 1
fi
