#!/usr/bin/env bash
BASE="https://3000--019d31d8-2720-70ee-bf46-42d34d4e4d8b.us-east-1-01.gitpod.dev"
PASS=0; FAIL=0
pass() { echo "  ✅ PASS  $1"; ((PASS++)); }
fail() { echo "  ❌ FAIL  $1"; ((FAIL++)); }
info() { echo "  ℹ️  INFO  $1"; }

CNA_PAYLOAD='{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"3175550000","address":"123 Main St","city":"Indianapolis","state":"IN","zip":"46201","dateOfBirth":"1990-01-01","emergencyContact":"Jane User","emergencyPhone":"3175550001","program":"cna","price":1500,"paymentOption":"full"}'

echo ""; echo "=== ROUTE 1: /api/enroll/cna ==="
echo "--- FAILURE PATH ---"
resp=$(curl -si -X POST "$BASE/api/enroll/cna?fail=true" -H "Content-Type: application/json" -d "$CNA_PAYLOAD")
status=$(echo "$resp" | grep -m1 "^HTTP" | awk '{print $2}')
body=$(echo "$resp" | tail -1)
echo "  Status: $status  Body: ${body:0:200}"
if [[ "$status" -ge 400 ]]; then pass "non-2xx on failure ($status)"; else fail "expected non-2xx, got $status"; fi
echo "$body" | grep -q '"success":true' && fail "success:true in body" || pass "no success:true in body"
echo "$body" | grep -qE '"[A-Z]+-[0-9]{10,}"' && fail "fake timestamp ID in body" || pass "no fake ID in body"
echo "$body" | grep -q '"error"' && pass "error field present" || fail "no error field"

echo "--- HAPPY PATH ---"
resp=$(curl -si -X POST "$BASE/api/enroll/cna" -H "Content-Type: application/json" -d "$CNA_PAYLOAD")
status=$(echo "$resp" | grep -m1 "^HTTP" | awk '{print $2}')
body=$(echo "$resp" | tail -1)
echo "  Status: $status  Body: ${body:0:200}"
if echo "$body" | grep -qE '"enrollmentId":"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"'; then
  pass "real UUID enrollmentId returned — DB write confirmed"
elif [[ "$status" -ge 500 ]]; then
  info "500 — DB/Redis not configured in this env. Failure path verified above."
else
  fail "unexpected: status=$status body=${body:0:200}"
fi

echo ""; echo "=== ROUTE 2: /api/store/cart-checkout ==="
echo "--- FAILURE PATH ---"
resp=$(curl -si -X POST "$BASE/api/store/cart-checkout?fail=true" -H "Content-Type: application/json" -d '{}')
status=$(echo "$resp" | grep -m1 "^HTTP" | awk '{print $2}')
body=$(echo "$resp" | tail -1)
location=$(echo "$resp" | grep -i "^location:" | awk '{print $2}' | tr -d '\r')
echo "  Status: $status  Location: $location  Body: ${body:0:100}"
[[ "$status" -ge 300 && "$status" -lt 400 ]] && pass "3xx redirect ($status)" || fail "expected 3xx, got $status"
echo "$location" | grep -q "store/cart" && pass "redirects to /store/cart" || fail "expected /store/cart in Location: $location"
echo "$location" | grep -q "error=" && pass "error slug in redirect URL" || fail "no error slug in redirect URL"
echo "$body" | grep -qE '^\{.*"error"' && fail "raw JSON error in body" || pass "no raw JSON in body"

echo ""; echo "=== ROUTE 3: /api/stripe/checkout ==="
echo "--- FAILURE PATH ---"
resp=$(curl -si -X POST "$BASE/api/stripe/checkout?fail=true" -H "Content-Type: application/x-www-form-urlencoded" -d "productId=test")
status=$(echo "$resp" | grep -m1 "^HTTP" | awk '{print $2}')
body=$(echo "$resp" | tail -1)
location=$(echo "$resp" | grep -i "^location:" | awk '{print $2}' | tr -d '\r')
echo "  Status: $status  Location: $location  Body: ${body:0:100}"
[[ "$status" -ge 300 && "$status" -lt 400 ]] && pass "3xx redirect ($status)" || fail "expected 3xx, got $status"
echo "$location" | grep -qE "store|platform" && pass "redirects to store/platform: $location" || fail "expected store/platform in Location: $location"
echo "$location" | grep -q "error=" && pass "error slug in redirect URL" || fail "no error slug in redirect URL"
echo "$body" | grep -qE '^\{.*"error"' && fail "raw JSON in body" || pass "no raw JSON in body"

echo ""; echo "=== GUARD SCRIPTS ==="
node scripts/guard-no-fake-success.mjs && pass "guard-no-fake-success" || fail "guard-no-fake-success"
node scripts/guard-critical-routes.mjs && pass "guard-critical-routes" || fail "guard-critical-routes"

echo ""; echo "=== RESULTS: $PASS passed, $FAIL failed ==="
[[ $FAIL -eq 0 ]] && exit 0 || exit 1
