#!/bin/bash
# Regression test for /apply redirects
# Run: ./scripts/test-apply-redirects.sh

BASE_URL="${1:-https://www.elevateforhumanity.org}"
FAILED=0

echo "Testing /apply redirects on $BASE_URL"
echo "========================================"

# Test 1: /apply?program=barber-apprenticeship should 307 to form
echo -n "Test 1: /apply?program=barber-apprenticeship -> 307... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/apply?program=barber-apprenticeship")
LOCATION=$(curl -sI "$BASE_URL/apply?program=barber-apprenticeship" | grep -i "^location:" | tr -d '\r')
if [[ "$STATUS" == "307" ]] && [[ "$LOCATION" == *"/forms/barber-apprenticeship-inquiry"* ]]; then
  echo "PASS"
else
  echo "FAIL (status=$STATUS, location=$LOCATION)"
  FAILED=1
fi

# Test 2: /apply?program=barber should also redirect
echo -n "Test 2: /apply?program=barber -> 307... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/apply?program=barber")
if [[ "$STATUS" == "307" ]]; then
  echo "PASS"
else
  echo "FAIL (status=$STATUS)"
  FAILED=1
fi

# Test 3: Form page should return 200
echo -n "Test 3: /forms/barber-apprenticeship-inquiry -> 200... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/forms/barber-apprenticeship-inquiry")
if [[ "$STATUS" == "200" ]]; then
  echo "PASS"
else
  echo "FAIL (status=$STATUS)"
  FAILED=1
fi

# Test 4: /apply without program should return 200 (shows selection page)
echo -n "Test 4: /apply (no program) -> 200... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/apply")
if [[ "$STATUS" == "200" ]]; then
  echo "PASS"
else
  echo "FAIL (status=$STATUS)"
  FAILED=1
fi

echo "========================================"
if [[ $FAILED -eq 0 ]]; then
  echo "All tests passed!"
  exit 0
else
  echo "Some tests failed!"
  exit 1
fi
