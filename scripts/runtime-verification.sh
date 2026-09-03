#!/bin/bash
# Runtime Verification Script
# Tests all major platform endpoints

echo "=============================================="
echo "ELEVATE LMS - RUNTIME VERIFICATION"
echo "=============================================="
echo ""

# Configuration
MARKETING_URL="https://work-1-zwapflgqzcvfvlvh.prod-runtime.all-hands.dev"
ADMIN_URL="https://work-2-zwapflgqzcvfvlvh.prod-runtime.all-hands.dev"

PASS=0
FAIL=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    echo -n "Testing: $name ... "
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$code" == "$expected_code" ]; then
        echo "✅ $code"
        ((PASS++))
    else
        echo "❌ Got $code (expected $expected_code)"
        ((FAIL++))
    fi
}

echo "=== MARKETING SITE ==="
test_endpoint "Homepage" "$MARKETING_URL/"
test_endpoint "Programs page" "$MARKETING_URL/programs"
test_endpoint "PARIS page" "$MARKETING_URL/paris"
test_endpoint "Apply page" "$MARKETING_URL/apply"
test_endpoint "Health check" "$MARKETING_URL/api/health/northflank"
echo ""

echo "=== ADMIN SITE ==="
test_endpoint "Admin homepage" "$ADMIN_URL/"
test_endpoint "Admin dashboard" "$ADMIN_URL/admin"
test_endpoint "Admin health check" "$ADMIN_URL/api/health/northflank"
echo ""

echo "=== API ENDPOINTS ==="
test_endpoint "PARIS API" "$MARKETING_URL/api/paris" "405"  # POST only
test_endpoint "Jobs search" "$MARKETING_URL/api/jobs/search?what=Medical%20Assistant"
test_endpoint "Jobs salary" "$MARKETING_URL/api/jobs/salary?title=Medical%20Assistant"
test_endpoint "Programs API" "$MARKETING_URL/api/programs"
echo ""

echo "=== LMS ENDPOINTS ==="
test_endpoint "LMS dashboard" "$MARKETING_URL/lms"
test_endpoint "LMS placement" "$MARKETING_URL/lms/placement"
test_endpoint "LMS courses" "$MARKETING_URL/lms/courses"
echo ""

echo "=============================================="
echo "RESULTS: $PASS passed, $FAIL failed"
echo "=============================================="

if [ $FAIL -gt 0 ]; then
    echo ""
    echo "⚠️  Some endpoints are not responding."
    echo "    Check Northflank deployment status."
    exit 1
fi

exit 0
