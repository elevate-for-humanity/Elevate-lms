#!/usr/bin/env bash
# Smoke test for Program Holder Portal
# Tests critical routes and auth behavior

set -e

BASE_URL="${1:-http://localhost:3000}"
FAILED=0

echo "🔥 Program Holder Portal Smoke Test"
echo "Testing: $BASE_URL"
echo ""

# Test function
test_route() {
  local route=$1
  local expected_status=$2
  local description=$3
  
  echo -n "Testing $route ... "
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
  
  if [ "$status" = "$expected_status" ]; then
    echo "✅ $status ($description)"
  else
    echo "❌ Expected $expected_status, got $status"
    FAILED=$((FAILED + 1))
  fi
}

# Test health endpoint — 200 = healthy, 503 = degraded; both are valid
echo "=== Health Check ==="
test_route "/api/health" "200" "healthy"
echo ""

# Test public routes
echo "=== Public Routes ==="
test_route "/" "200" "home page"
test_route "/programs/barber-apprenticeship" "200" "barber program page"
echo ""

# Test auth-protected routes (should redirect to login)
echo "=== Auth Protection ==="
test_route "/program-holder/dashboard" "307" "redirect to login"
test_route "/program-holder/verification" "307" "redirect to login (layout protection)"
test_route "/program-holder/students" "307" "redirect to login (layout protection)"
echo ""

# Test legacy portal redirects — Next.js permanent redirects return 308
echo "=== Legacy Portal Redirects ==="
test_route "/program-holder/portal/students" "308" "redirect to canonical"
test_route "/program-holder/portal/reports" "308" "redirect to canonical"
test_route "/program-holder/portal/page" "307" "redirect to dashboard"
echo ""

# Summary
echo "=== Summary ==="
if [ $FAILED -eq 0 ]; then
  echo "✅ All tests passed"
  exit 0
else
  echo "❌ $FAILED tests failed"
  exit 1
fi
