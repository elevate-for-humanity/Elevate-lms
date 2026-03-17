#!/usr/bin/env bash
set -euo pipefail

pass=0
fail=0
soft_fail=0

check_pass() {
  echo "PASS: $1"
  pass=$((pass + 1))
}

check_fail() {
  echo "FAIL: $1"
  fail=$((fail + 1))
}

check_soft_fail() {
  echo "SOFT FAIL: $1"
  soft_fail=$((soft_fail + 1))
}

# Load .env.local if present
if [ -f ".env.local" ]; then
  set -a
  source .env.local 2>/dev/null || true
  set +a
fi

command -v xmllint >/dev/null 2>&1 && check_pass "xmllint installed" || check_fail "xmllint not installed"

[ -d "lib/tax-software/schemas/2024" ] && check_pass "schema dir exists" || check_fail "schema dir missing"

find "lib/tax-software/schemas/2024" -type f -name "*.xsd" 2>/dev/null | grep -q . \
  && check_pass "schema files present" \
  || check_fail "no XSD files present"

[ -n "${IRS_EFIN:-}" ] && check_pass "IRS_EFIN set" || check_fail "IRS_EFIN unset"
[ -n "${CRON_SECRET:-}" ] && check_pass "CRON_SECRET set" || check_fail "CRON_SECRET unset"
[ -n "${IRS_ENVIRONMENT:-}" ] && check_pass "IRS_ENVIRONMENT set" || check_fail "IRS_ENVIRONMENT unset"

if [ -n "${IRS_SOFTWARE_ID:-}" ]; then
  check_pass "IRS_SOFTWARE_ID set"
else
  check_soft_fail "IRS_SOFTWARE_ID unset (external IRS dependency)"
fi

echo ""
echo "Results: ${pass} passed, ${fail} failed, ${soft_fail} soft failed"

if [ "$fail" -gt 0 ]; then
  echo "VERDICT: NO-GO"
  exit 1
fi

if [ "$soft_fail" -gt 0 ]; then
  echo "VERDICT: PARTIAL GO"
  exit 0
fi

echo "VERDICT: GO"
