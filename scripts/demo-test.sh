#!/bin/bash

# LMS Demo Test Script
# Tests all major routes for 200 status codes

BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  LMS Demo Readiness Test"
echo "  Base URL: $BASE_URL"
echo "=============================================="
echo ""

test_route() {
    local route=$1
    local name=$2
    local expected=${3:-200}
    
    TOTAL=$((TOTAL + 1))
    
    # Use curl with timeout and follow redirects
    status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "$BASE_URL$route" 2>/dev/null)
    
    if [ "$status" = "$expected" ] || [ "$status" = "200" ] || [ "$status" = "307" ] || [ "$status" = "308" ]; then
        echo -e "${GREEN}✅ PASS${NC} [$status] $name ($route)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} [$status] $name ($route) - Expected: $expected"
        FAILED=$((FAILED + 1))
    fi
}

echo "========== PUBLIC PAGES =========="
test_route "/" "Homepage"
test_route "/about" "About Page"
test_route "/programs" "Programs Catalog"
test_route "/accreditation" "Accreditation"
test_route "/contact" "Contact Page"
test_route "/login" "Login Page"
test_route "/signup" "Signup Page"
test_route "/services" "Services"
test_route "/careers" "Careers"
test_route "/success-stories" "Success Stories"

echo ""
echo "========== PROGRAM PAGES =========="
test_route "/programs/healthcare" "Healthcare Programs"
test_route "/programs/technology" "Technology Programs"
test_route "/programs/skilled-trades" "Skilled Trades"
test_route "/programs/tax-preparation" "Tax Preparation"
test_route "/programs/barber" "Barber Program"
test_route "/programs/cosmetology" "Cosmetology Program"

echo ""
echo "========== LMS/STUDENT PAGES =========="
test_route "/lms" "LMS Main"
test_route "/student-portal" "Student Portal"
test_route "/onboarding" "Onboarding"

echo ""
echo "========== PARTNER PAGES =========="
test_route "/partners" "Partners Main"
test_route "/workforce-partners" "Workforce Partners"
test_route "/training-providers" "Training Providers"

echo ""
echo "========== SUPPORT PAGES =========="
test_route "/support" "Support Main"
test_route "/support/contact" "Support Contact"
test_route "/support/help" "Help Center"

echo ""
echo "========== LEGAL/COMPLIANCE =========="
test_route "/privacy-policy" "Privacy Policy"
test_route "/terms" "Terms of Service"
test_route "/accessibility" "Accessibility"
test_route "/academic-integrity" "Academic Integrity"

echo ""
echo "========== STORE PAGES =========="
test_route "/store" "Store Main"
test_route "/store/licenses" "Licenses"

echo ""
echo "========== ADMIN PAGES (Auth Required) =========="
test_route "/admin" "Admin Dashboard" "307"
test_route "/admin-login" "Admin Login"

echo ""
echo "========== API HEALTH CHECKS =========="
test_route "/api/health" "Health API" "200"

echo ""
echo "=============================================="
echo "  TEST RESULTS"
echo "=============================================="
echo -e "  Total:  $TOTAL"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED - DEMO READY!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed - Review before demo${NC}"
    exit 1
fi
