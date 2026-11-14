#!/usr/bin/env bash
# Post-deploy verification for program URL routing changes.
# Run within 30 minutes of deploy.
#
# Usage: ./scripts/post-deploy-verify.sh [domain]
# Default: https://www.elevateforhumanity.org

set -uo pipefail

DOMAIN="${1:-https://www.elevateforhumanity.org}"
PASS=0
FAIL=0

check() {
  local url="$1" expected_status="$2" expected_location="${3:-}"
  local status location
  status=$(curl -sI -H "Cache-Control: no-cache" -H "Pragma: no-cache" -o /dev/null -w "%{http_code}" "$DOMAIN$url")
  location=$(curl -sI -H "Cache-Control: no-cache" -H "Pragma: no-cache" -o /dev/null -w "%{redirect_url}" "$DOMAIN$url" 2>/dev/null | sed "s|$DOMAIN||")

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

echo "Post-deploy verification against $DOMAIN"
echo "Using no-cache headers to bypass edge cache"
echo ""

echo "=== 1. Critical fix: CPR page serves directly (was redirecting to CNA) ==="
check "/programs/cpr-first-aid" "200"

echo ""
echo "=== 2. Legacy slugs redirect to correct targets ==="
check "/programs/cpr-first-aid-hsi"       "308" "/programs/cpr-first-aid"
check "/programs/cdl"                      "308" "/programs/cdl-training"
check "/programs/forklift"                 "308" "/programs/skilled-trades"
check "/programs/tax-entrepreneurship"     "308" ""
check "/programs/cdl-class-a"              "308" "/programs/cdl-training"
check "/programs/certified-nursing-assistant" "308" "/programs/cna"
check "/programs/medical-coding-billing"   "308" "/programs/healthcare"
check "/programs/cosmetology"              "308" "/programs/cosmetology-apprenticeship"
check "/programs/phlebotomy-technician"    "308" "/programs/healthcare"

echo ""
echo "=== 3. Dedicated pages return 200 ==="
for slug in cpr-first-aid cdl-training cna bookkeeping skilled-trades healthcare \
            welding electrical plumbing hvac-technician barber-apprenticeship \
            cosmetology-apprenticeship medical-assistant pharmacy-technician \
            web-development cybersecurity-analyst it-help-desk entrepreneurship \
            tax-preparation business software-development; do
  check "/programs/$slug" "200"
done

echo ""
echo "=== 4. Canonical tag check (CPR page) ==="
canonical=$(curl -s -H "Cache-Control: no-cache" "$DOMAIN/programs/cpr-first-aid" | grep -oP 'rel="canonical"[^>]*href="[^"]+"|href="[^"]+"\s*rel="canonical"' | grep -oP 'href="[^"]+' | sed 's/href="//')
if echo "$canonical" | grep -q "cpr-first-aid"; then
  echo "  OK canonical=$canonical"
  ((PASS++))
else
  echo "FAIL canonical=$canonical (expected cpr-first-aid)"
  ((FAIL++))
fi

echo ""
echo "=== 5. Sitemap includes CPR, excludes legacy ==="
sitemap=$(curl -s "$DOMAIN/sitemap.xml" 2>/dev/null)
if echo "$sitemap" | grep -q "cpr-first-aid"; then
  echo "  OK /programs/cpr-first-aid in sitemap"
  ((PASS++))
else
  echo "WARN /programs/cpr-first-aid not found in sitemap (may need rebuild)"
fi
if echo "$sitemap" | grep -q "cpr-first-aid-hsi"; then
  echo "FAIL cpr-first-aid-hsi found in sitemap (should be excluded)"
  ((FAIL++))
else
  echo "  OK cpr-first-aid-hsi not in sitemap"
  ((PASS++))
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
echo ""
echo "=== Manual steps remaining ==="
echo "  1. Run scripts/verify-program-slugs.sql in Supabase SQL Editor"
echo "  2. In Google Search Console: inspect /programs/cpr-first-aid"
echo "     - Verify canonical is self-referencing (not /programs/cna)"
echo "     - Request indexing"
echo "  3. If any redirects still show old targets, purge Netlify cache:"
echo "     Netlify UI → Site → Deploys → Trigger deploy → Clear cache and deploy"
echo "  4. Monitor /programs/* 404s for 1 week via Netlify analytics"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
