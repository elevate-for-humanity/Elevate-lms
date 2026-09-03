#!/bin/bash
# Test script for program pages
# Verifies all program pages are accessible and return 200 status

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🧪 Testing Program Pages"
echo ""
echo "Base URL: $BASE_URL"
echo ""
echo "================================================================================"

PASSED=0
FAILED=0
FAILED_PAGES=""

test_url() {
    local url="$1"
    local name="$2"
    
    # Follow redirects and get final status code
    local status=$(curl -sL -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$status" = "200" ]; then
        echo "✅ $name - $status"
        ((PASSED++))
    else
        echo "❌ $name - $status"
        ((FAILED++))
        FAILED_PAGES="$FAILED_PAGES\n  - $name ($status)"
    fi
}

echo ""
echo "📄 Testing Main Programs Page..."
echo ""
test_url "$BASE_URL/programs" "/programs"

echo ""
echo "📁 Testing Category Pages..."
echo ""
test_url "$BASE_URL/programs/healthcare" "/programs/healthcare"
test_url "$BASE_URL/programs/skilled-trades" "/programs/skilled-trades"
test_url "$BASE_URL/programs/beauty" "/programs/beauty"
test_url "$BASE_URL/programs/technology" "/programs/technology"
test_url "$BASE_URL/programs/business" "/programs/business"
test_url "$BASE_URL/programs/cdl-transportation" "/programs/cdl-transportation"
test_url "$BASE_URL/programs/apprenticeships" "/programs/apprenticeships"
test_url "$BASE_URL/programs/federal-funded" "/programs/federal-funded"
test_url "$BASE_URL/programs/micro-programs" "/programs/micro-programs"

echo ""
echo "📋 Testing Individual Program Pages (from data/programs.ts)..."
echo ""
# Programs from app/data/programs.ts
test_url "$BASE_URL/programs/hvac-technician" "/programs/hvac-technician"
test_url "$BASE_URL/programs/barber-apprenticeship" "/programs/barber-apprenticeship"
test_url "$BASE_URL/programs/cna-certification" "/programs/cna-certification"
test_url "$BASE_URL/programs/cdl-training" "/programs/cdl-training"
test_url "$BASE_URL/programs/building-maintenance-tech" "/programs/building-maintenance-tech"
test_url "$BASE_URL/programs/beauty-career-educator" "/programs/beauty-career-educator"
test_url "$BASE_URL/programs/business-startup-marketing" "/programs/business-startup-marketing"
test_url "$BASE_URL/programs/emergency-health-safety-tech" "/programs/emergency-health-safety-tech"
test_url "$BASE_URL/programs/professional-esthetician" "/programs/professional-esthetician"
test_url "$BASE_URL/programs/certified-peer-recovery-coach" "/programs/certified-peer-recovery-coach"
test_url "$BASE_URL/programs/tax-prep-financial-services" "/programs/tax-prep-financial-services"
test_url "$BASE_URL/programs/phlebotomy-technician" "/programs/phlebotomy-technician"
test_url "$BASE_URL/programs/cpr-first-aid-hsi" "/programs/cpr-first-aid-hsi"
test_url "$BASE_URL/programs/home-health-aide" "/programs/home-health-aide"
test_url "$BASE_URL/programs/medical-assistant" "/programs/medical-assistant"
test_url "$BASE_URL/programs/public-safety-reentry-specialist" "/programs/public-safety-reentry-specialist"
test_url "$BASE_URL/programs/drug-alcohol-specimen-collector" "/programs/drug-alcohol-specimen-collector"

echo ""
echo "📂 Testing Program Subdirectories..."
echo ""
test_url "$BASE_URL/programs/cna" "/programs/cna"
test_url "$BASE_URL/programs/cosmetology-apprenticeship" "/programs/cosmetology-apprenticeship"
test_url "$BASE_URL/programs/esthetician-apprenticeship" "/programs/esthetician-apprenticeship"
test_url "$BASE_URL/programs/nail-technician-apprenticeship" "/programs/nail-technician-apprenticeship"
test_url "$BASE_URL/programs/direct-support-professional" "/programs/direct-support-professional"
test_url "$BASE_URL/programs/drug-collector" "/programs/drug-collector"
test_url "$BASE_URL/programs/jri" "/programs/jri"
test_url "$BASE_URL/programs/tax-preparation" "/programs/tax-preparation"
test_url "$BASE_URL/programs/tax-entrepreneurship" "/programs/tax-entrepreneurship"
test_url "$BASE_URL/programs/business-financial" "/programs/business-financial"

echo ""
echo "================================================================================"
echo ""
echo "📊 Test Summary"
echo ""
TOTAL=$((PASSED + FAILED))
echo "Total Tests: $TOTAL"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo "Success Rate: ${SUCCESS_RATE}%"
fi

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "❌ Failed Pages:"
    echo -e "$FAILED_PAGES"
    exit 1
else
    echo ""
    echo "🎉 All tests passed!"
    exit 0
fi
