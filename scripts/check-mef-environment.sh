#!/usr/bin/env bash
set -euo pipefail

pass=0
fail=0

check_pass() {
  echo "PASS: $1"
  pass=$((pass + 1))
}

check_fail() {
  echo "FAIL: $1"
  fail=$((fail + 1))
}

# Load .env.local if present
if [ -f ".env.local" ]; then
  set -a
  source .env.local 2>/dev/null || true
  set +a
fi

echo "MeF local configuration preflight — not IRS certification or transmission verification"
tax_year="${IRS_TAX_YEAR:-2026}"
schema_dir="${IRS_SCHEMA_DIR:-lib/tax-software/schemas/${tax_year}}"
command -v xmllint >/dev/null 2>&1 && check_pass "xmllint installed" || check_fail "xmllint not installed"

[ -d "$schema_dir" ] && check_pass "schema dir exists for selected tax year" || check_fail "schema dir missing for selected tax year"

find "$schema_dir" -type f -name "*.xsd" -print -quit 2>/dev/null | grep -q . \
  && check_pass "schema files present" \
  || check_fail "no XSD files present"

[ -n "${IRS_WSDL_PATH:-}" ] && [ -s "$IRS_WSDL_PATH" ] && check_pass "WSDL package file present" || check_fail "IRS_WSDL_PATH missing or empty"
[ -n "${IRS_BUSINESS_RULES_PATH:-}" ] && [ -s "$IRS_BUSINESS_RULES_PATH" ] && check_pass "business rules package present" || check_fail "IRS_BUSINESS_RULES_PATH missing or empty"
[ -n "${IRS_A2A_CERT_PATH:-}" ] && [ -s "$IRS_A2A_CERT_PATH" ] && check_pass "A2A certificate file present" || check_fail "IRS_A2A_CERT_PATH missing or empty"
for setting in IRS_ETIN IRS_APPSYSID; do
  [ -n "${!setting:-}" ] && check_pass "$setting set" || check_fail "$setting unset"
done
# No IRS adapter exists yet. File presence is necessary, not evidence it works.
[ -s "lib/tax-software/transmission/adapters/irs-mef.ts" ] && check_pass "IRS adapter source present; integration tests still required" || check_fail "IRS transmission adapter not implemented"

[ -n "${IRS_EFIN:-}" ] && check_pass "IRS_EFIN set" || check_fail "IRS_EFIN unset"
[ -n "${CRON_SECRET:-}" ] && check_pass "CRON_SECRET set" || check_fail "CRON_SECRET unset"
[ -n "${IRS_ENVIRONMENT:-}" ] && check_pass "IRS_ENVIRONMENT set" || check_fail "IRS_ENVIRONMENT unset"

if [ -n "${IRS_SOFTWARE_ID:-}" ]; then
  check_pass "IRS_SOFTWARE_ID set"
else
  check_fail "IRS_SOFTWARE_ID unset (external IRS dependency)"
fi

echo ""
echo "Results: ${pass} passed, ${fail} failed"

if [ "$fail" -gt 0 ]; then
  echo "VERDICT: NO-GO"
  exit 1
fi

echo "VERDICT: CONFIGURATION PRESENT — XML validation, transport and ATS acceptance remain required"
