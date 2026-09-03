#!/usr/bin/env bash
# Smoke test: verify broken program slugs redirect correctly
# and all dedicated program pages return 200.
#
# Usage: ./scripts/test-redirects.sh [base_url]
# Default: http://localhost:3000

set -uo pipefail

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0

check_redirect() {
  local url="$1" expected_status="$2" expected_location="$3"
  local status location
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$url")
  location=$(curl -s -o /dev/null -w "%{redirect_url}" "$BASE$url" 2>/dev/null | sed "s|$BASE||")

  if [ "$status" = "$expected_status" ]; then
    if [ -n "$expected_location" ] && [ "$location" != "$expected_location" ]; then
      echo "FAIL $url → $location (expected $expected_location)"
      ((FAIL++))
    else
      echo "  OK $url → $status ${location:+→ $location}"
      ((PASS++))
    fi
  else
    echo "FAIL $url → $status (expected $expected_status)"
    ((FAIL++))
  fi
}

echo "Testing against $BASE"
echo ""

echo "--- Broken slugs must redirect (308) ---"
check_redirect "/programs/cpr-first-aid-hsi"       "308" "/programs/cpr-first-aid"
check_redirect "/programs/cdl"                      "308" "/programs/cdl-training"
check_redirect "/programs/forklift"                 "308" "/programs/skilled-trades"
check_redirect "/programs/tax-entrepreneurship"     "308" ""
check_redirect "/programs/cdl-class-a"              "308" "/programs/cdl-training"
check_redirect "/programs/certified-nursing-assistant" "308" "/programs/cna"
check_redirect "/programs/medical-coding-billing"   "308" "/programs/healthcare"
check_redirect "/programs/cosmetology"              "308" "/programs/cosmetology-apprenticeship"
check_redirect "/programs/phlebotomy-technician"    "308" "/programs/healthcare"

echo ""
echo "--- Dedicated pages must return 200 ---"
for slug in cpr-first-aid cdl-training cna bookkeeping skilled-trades healthcare \
            welding electrical plumbing hvac-technician barber-apprenticeship \
            cosmetology-apprenticeship medical-assistant pharmacy-technician \
            web-development cybersecurity-analyst it-help-desk entrepreneurship \
            tax-preparation business software-development; do
  check_redirect "/programs/$slug" "200" ""
done

echo ""
echo "--- Results: $PASS passed, $FAIL failed ---"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
