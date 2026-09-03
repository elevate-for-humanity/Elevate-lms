#!/bin/bash
# Production Smoke Test for Barber Apprenticeship Forms
# Run this after deployment to verify forms are working

DOMAIN="${1:-https://www.elevateforhumanity.org}"
TIMESTAMP=$(date +%s)

echo "=========================================="
echo "SMOKE TEST: Barber Apprenticeship Forms"
echo "Domain: $DOMAIN"
echo "Timestamp: $TIMESTAMP"
echo "=========================================="
echo ""

# Test 1: Inquiry Form
echo "TEST 1: Inquiry Form Submission"
echo "--------------------------------"
INQUIRY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$DOMAIN/api/inquiries" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Smoke Test $TIMESTAMP\",
    \"email\": \"smoketest-$TIMESTAMP@test.elevateforhumanity.org\",
    \"phone\": \"317-555-0000\",
    \"city\": \"Indianapolis\",
    \"program\": \"barber-apprenticeship\"
  }")

INQUIRY_BODY=$(echo "$INQUIRY_RESPONSE" | head -n -1)
INQUIRY_STATUS=$(echo "$INQUIRY_RESPONSE" | tail -n 1)

if [ "$INQUIRY_STATUS" = "200" ]; then
  echo "✅ PASS: Inquiry submitted (HTTP $INQUIRY_STATUS)"
  echo "   Response: $INQUIRY_BODY"
else
  echo "❌ FAIL: Inquiry failed (HTTP $INQUIRY_STATUS)"
  echo "   Response: $INQUIRY_BODY"
fi
echo ""

# Test 2: Application Form
echo "TEST 2: Application Form Submission"
echo "------------------------------------"
APP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$DOMAIN/api/applications" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Smoke\",
    \"lastName\": \"Test $TIMESTAMP\",
    \"email\": \"smoketest-app-$TIMESTAMP@test.elevateforhumanity.org\",
    \"phone\": \"317-555-0001\",
    \"city\": \"Indianapolis\",
    \"state\": \"IN\",
    \"hasHostShop\": \"no\",
    \"program\": \"Barber Apprenticeship\",
    \"programSlug\": \"barber-apprenticeship\",
    \"source\": \"smoke-test\"
  }")

APP_BODY=$(echo "$APP_RESPONSE" | head -n -1)
APP_STATUS=$(echo "$APP_RESPONSE" | tail -n 1)

if [ "$APP_STATUS" = "200" ]; then
  echo "✅ PASS: Application submitted (HTTP $APP_STATUS)"
  echo "   Response: $APP_BODY"
else
  echo "❌ FAIL: Application failed (HTTP $APP_STATUS)"
  echo "   Response: $APP_BODY"
fi
echo ""

# Test 3: Timeclock Context (should return 401 without auth)
echo "TEST 3: Timeclock Context (unauthenticated)"
echo "--------------------------------------------"
TC_RESPONSE=$(curl -s -w "\n%{http_code}" "$DOMAIN/api/timeclock/context")

TC_BODY=$(echo "$TC_RESPONSE" | head -n -1)
TC_STATUS=$(echo "$TC_RESPONSE" | tail -n 1)

if [ "$TC_STATUS" = "401" ]; then
  echo "✅ PASS: Timeclock returns 401 for unauthenticated (expected)"
else
  echo "⚠️  WARN: Timeclock returned HTTP $TC_STATUS (expected 401)"
  echo "   Response: $TC_BODY"
fi
echo ""

# Test 4: Page loads
echo "TEST 4: Page Load Tests"
echo "-----------------------"

check_page() {
  local url="$1"
  local expected="$2"
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$status" = "$expected" ]; then
    echo "✅ $url -> $status"
  else
    echo "❌ $url -> $status (expected $expected)"
  fi
}

check_page "$DOMAIN/programs/barber-apprenticeship" "200"
check_page "$DOMAIN/programs/barber-apprenticeship/apply" "200"
check_page "$DOMAIN/forms/barber-apprenticeship-inquiry" "200"
check_page "$DOMAIN/login" "200"

echo ""
echo "=========================================="
echo "SMOKE TEST COMPLETE"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Check Supabase 'applications' table for test rows"
echo "2. Delete test rows: email LIKE 'smoketest%@test.elevateforhumanity.org'"
echo "3. If any tests failed, check server logs"
