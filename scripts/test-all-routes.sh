#!/bin/bash
# Comprehensive route testing script
# Tests all main pages, store, license, demo, and API routes

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "=============================================="
echo "  COMPREHENSIVE ROUTE TEST"
echo "  Base URL: $BASE_URL"
echo "=============================================="

PASSED=0
FAILED=0
FAILED_ROUTES=""

test_route() {
    local path="$1"
    local expected="${2:-200}"
    
    local status=$(curl -sL -o /dev/null -w "%{http_code}" "$BASE_URL$path" 2>/dev/null)
    
    if [ "$status" = "$expected" ]; then
        echo "✅ $path ($status)"
        ((PASSED++))
    else
        echo "❌ $path (got $status, expected $expected)"
        ((FAILED++))
        FAILED_ROUTES="$FAILED_ROUTES\n  $path ($status)"
    fi
}

echo ""
echo "📄 MAIN PAGES"
echo "----------------------------------------"
test_route "/"
test_route "/about"
test_route "/contact"
test_route "/apply"
test_route "/login"
test_route "/register"
test_route "/dashboard"
test_route "/privacy"
test_route "/terms"

echo ""
echo "📚 PROGRAM PAGES"
echo "----------------------------------------"
test_route "/programs"
test_route "/programs/healthcare"
test_route "/programs/skilled-trades"
test_route "/programs/beauty"
test_route "/programs/technology"
test_route "/programs/business"
test_route "/programs/cdl-transportation"
test_route "/programs/apprenticeships"
test_route "/programs/hvac-technician"
test_route "/programs/cna-certification"
test_route "/programs/barber-apprenticeship"

echo ""
echo "🏪 STORE PAGES"
echo "----------------------------------------"
test_route "/store"
test_route "/store/cart"
test_route "/store/licenses"
test_route "/store/subscriptions"

echo ""
echo "📜 LICENSE PAGES"
echo "----------------------------------------"
test_route "/license"
test_route "/license/features"
test_route "/license/pricing"
test_route "/license/integrations"
test_route "/license/demo"

echo ""
echo "🎮 DEMO PAGES"
echo "----------------------------------------"
test_route "/demo"
test_route "/demo/learner"
test_route "/demo/admin"
test_route "/demo/employer"
test_route "/schedule"

echo ""
echo "👤 ADMIN PAGES"
echo "----------------------------------------"
test_route "/admin"
test_route "/admin/dashboard"
test_route "/admin/students"
test_route "/admin/programs"
test_route "/admin/reports"

echo ""
echo "🤝 PARTNER PAGES"
echo "----------------------------------------"
test_route "/partners"
test_route "/employers"
test_route "/government"
test_route "/funding-impact"

echo ""
echo "📰 CONTENT PAGES"
echo "----------------------------------------"
test_route "/blog"
test_route "/faq"
test_route "/careers"
test_route "/donate"

echo ""
echo "=============================================="
echo "  TEST SUMMARY"
echo "=============================================="
TOTAL=$((PASSED + FAILED))
echo "Total Routes Tested: $TOTAL"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo "Success Rate: ${SUCCESS_RATE}%"
fi

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "❌ FAILED ROUTES:"
    echo -e "$FAILED_ROUTES"
    exit 1
else
    echo ""
    echo "🎉 All routes passed!"
    exit 0
fi
