#!/bin/bash

# ==============================================
# ELEVATE LMS - FULL PLATFORM TEST SCRIPT
# Tests all major features for demo readiness
# ==============================================

BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0
TOTAL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "=============================================="
echo "  ELEVATE LMS - FULL PLATFORM TEST"
echo "  $(date)"
echo "  Base URL: $BASE_URL"
echo "=============================================="

test_route() {
    local route=$1
    local name=$2
    TOTAL=$((TOTAL + 1))
    status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 15 "$BASE_URL$route" 2>/dev/null)
    if [ "$status" = "200" ] || [ "$status" = "307" ] || [ "$status" = "308" ]; then
        echo -e "  ${GREEN}✅${NC} $name"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${RED}❌${NC} $name [$status]"
        FAILED=$((FAILED + 1))
    fi
}

# ==============================================
# 1. PUBLIC WEBSITE
# ==============================================
echo ""
echo -e "${BLUE}━━━ PUBLIC WEBSITE ━━━${NC}"
test_route "/" "Homepage"
test_route "/about" "About"
test_route "/programs" "Programs Catalog"
test_route "/courses" "Courses Catalog"
test_route "/services" "Services"
test_route "/careers" "Careers"
test_route "/contact" "Contact"
test_route "/success-stories" "Success Stories"
test_route "/accreditation" "Accreditation"

# ==============================================
# 2. PROGRAM PAGES
# ==============================================
echo ""
echo -e "${BLUE}━━━ PROGRAM PAGES ━━━${NC}"
test_route "/programs/healthcare" "Healthcare Programs"
test_route "/programs/technology" "Technology Programs"
test_route "/programs/skilled-trades" "Skilled Trades"
test_route "/programs/barber" "Barber Program"
test_route "/programs/cosmetology" "Cosmetology"
test_route "/programs/cna" "CNA Program"
test_route "/programs/hvac" "HVAC Program"
test_route "/programs/cdl" "CDL Program"

# ==============================================
# 3. ENROLLMENT & APPLICATION
# ==============================================
echo ""
echo -e "${BLUE}━━━ ENROLLMENT & APPLICATION ━━━${NC}"
test_route "/enroll" "Enrollment Page"
test_route "/apply" "Application Form"
test_route "/login" "Login"
test_route "/signup" "Signup"
test_route "/onboarding" "Student Onboarding"

# ==============================================
# 4. LMS / STUDENT PORTAL
# ==============================================
echo ""
echo -e "${BLUE}━━━ LMS / STUDENT PORTAL ━━━${NC}"
test_route "/lms" "LMS Home"
test_route "/lms/dashboard" "Student Dashboard"
test_route "/student-portal" "Student Portal"

# ==============================================
# 5. STORE & LICENSING
# ==============================================
echo ""
echo -e "${BLUE}━━━ STORE & LICENSING ━━━${NC}"
test_route "/store" "Store Home"
test_route "/store/licenses" "License Options"
test_route "/store/licenses/checkout/efh-core-platform" "Core License Checkout"
test_route "/store/licenses/checkout/school-license" "School License Checkout"
test_route "/store/licenses/checkout/enterprise-license" "Enterprise Checkout"
test_route "/store/licenses/checkout/monthly-subscription" "Monthly Subscription"
test_route "/store/demo" "Platform Demo"
test_route "/store/demo/student" "Student Demo"
test_route "/store/demo/admin" "Admin Demo"
test_route "/store/compliance" "Compliance Info"
test_route "/store/deployment" "Deployment Guide"
test_route "/store/integrations" "Integrations"
test_route "/store/success" "Purchase Success"

# ==============================================
# 6. ADMIN PORTAL (Auth Required)
# ==============================================
echo ""
echo -e "${BLUE}━━━ ADMIN PORTAL ━━━${NC}"
test_route "/admin" "Admin Dashboard"
test_route "/admin/dashboard" "Admin Overview"
test_route "/admin/students" "Student Management"
test_route "/admin/programs" "Program Management"
test_route "/admin/applications" "Applications"
test_route "/admin/enrollments" "Enrollments"
test_route "/admin/courses" "Courses"
test_route "/admin/analytics" "Analytics"
test_route "/admin/compliance" "Compliance"
test_route "/admin/reports" "Reports"
test_route "/admin/settings" "Settings"

# ==============================================
# 7. PARTNER PORTAL
# ==============================================
echo ""
echo -e "${BLUE}━━━ PARTNER PORTAL ━━━${NC}"
test_route "/partners" "Partners Home"
test_route "/partners/portal" "Partner Portal"
test_route "/workforce-partners" "Workforce Partners"
test_route "/training-providers" "Training Providers"

# ==============================================
# 8. SUPPORT & HELP
# ==============================================
echo ""
echo -e "${BLUE}━━━ SUPPORT & HELP ━━━${NC}"
test_route "/support" "Support Home"
test_route "/support/help" "Help Center"
test_route "/support/contact" "Contact Support"

# ==============================================
# 9. LEGAL & COMPLIANCE
# ==============================================
echo ""
echo -e "${BLUE}━━━ LEGAL & COMPLIANCE ━━━${NC}"
test_route "/privacy-policy" "Privacy Policy"
test_route "/terms" "Terms of Service"
test_route "/accessibility" "Accessibility"
test_route "/cookies" "Cookie Policy"

# ==============================================
# 10. API ENDPOINTS
# ==============================================
echo ""
echo -e "${BLUE}━━━ API ENDPOINTS ━━━${NC}"
test_route "/api/health" "Health Check API"

# ==============================================
# RESULTS
# ==============================================
echo ""
echo "=============================================="
echo "  TEST RESULTS"
echo "=============================================="
echo -e "  Total Tests:  $TOTAL"
echo -e "  ${GREEN}Passed:       $PASSED${NC}"
echo -e "  ${RED}Failed:       $FAILED${NC}"
echo ""

PASS_RATE=$((PASSED * 100 / TOTAL))
echo -e "  Pass Rate:    ${PASS_RATE}%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🎉 ALL TESTS PASSED - PLATFORM READY!${NC}"
    echo -e "${GREEN}══════════════════════════════════════════════${NC}"
    exit 0
elif [ $PASS_RATE -ge 90 ]; then
    echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  ⚠️  MOSTLY READY - Review failed tests${NC}"
    echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}══════════════════════════════════════════════${NC}"
    echo -e "${RED}  ❌ ISSUES FOUND - Fix before demo${NC}"
    echo -e "${RED}══════════════════════════════════════════════${NC}"
    exit 1
fi
