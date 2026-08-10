#!/usr/bin/env bash
# Production activation gate for the current three-application Northflank
# architecture: Marketing, LMS, and Admin.
#
# This gate is intentionally source/config focused. Expensive builds belong to
# the dedicated CI/container workflows and live database drift is enforced by
# scripts/audit-schema-drift.ts in Integrity Gate.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=6144}"
export BUILD_SCOPE="${BUILD_SCOPE:-1}"

FAIL=0
WARN=0

run() {
  local name="$1"
  shift
  echo ""
  echo "--- $name ---"
  if "$@"; then
    echo "OK: $name"
  else
    echo "FAIL: $name"
    FAIL=$((FAIL + 1))
  fi
}

warn_run() {
  local name="$1"
  shift
  echo ""
  echo "--- $name ---"
  if "$@"; then
    echo "OK: $name"
  else
    echo "WARN: $name"
    WARN=$((WARN + 1))
  fi
}

section() {
  echo ""
  echo "=============================================="
  echo "$1"
  echo "=============================================="
}

section "SECTION 1: DEPLOYED APPLICATION ARCHITECTURE"

for app in marketing lms admin; do
  if [[ -d "apps/$app/app" && -f "apps/$app/package.json" ]]; then
    echo "OK: apps/$app is present"
  else
    echo "FAIL: apps/$app is incomplete"
    FAIL=$((FAIL + 1))
  fi
done

if [[ -f "apps/lms/middleware.ts" ]]; then
  echo "OK: LMS middleware exists"
else
  echo "FAIL: LMS middleware missing"
  FAIL=$((FAIL + 1))
fi

if [[ -f "apps/admin/middleware.ts" ]]; then
  echo "OK: Admin middleware exists"
else
  echo "FAIL: Admin middleware missing"
  FAIL=$((FAIL + 1))
fi

run "Next.js version parity" pnpm run verify:next-parity
run "Build identity configuration" pnpm run verify:build-identity
run "Repository integrity" node scripts/verify-repository-integrity.cjs
run "No AWS ECS deploy artifacts" node scripts/verify-no-aws-deploy.mjs
run "No legacy Studio shell wiring" node scripts/verify-no-studio-shell.mjs

section "SECTION 2: SECURITY AND ROUTE PROTECTION"

run "API admin guards" bash scripts/audit-api-auth-guards.sh
run "Auth gaps" bash scripts/audit-auth-gaps.sh
run "Environment contract" bash scripts/audit-env-vars.sh
run "Redirect conflicts" env BUILD_SCOPE=1 node scripts/check-redirect-conflicts.mjs
run "Public route guards" node scripts/guard-public-routes.mjs
run "Pre-auth registry" node scripts/check-pre-auth-registry.cjs

if [[ -f "scripts/audit-public-html.mjs" ]]; then
  run "Public HTML hygiene" node scripts/audit-public-html.mjs
fi

section "SECTION 3: DATABASE AND PROGRAM SOURCE DISCIPLINE"

run "Migration lint" node scripts/lint-migrations.cjs

if [[ -d "supabase/migrations/pending" ]]; then
  PENDING_SQL=$(find supabase/migrations/pending -type f -name '*.sql' 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$PENDING_SQL" -gt 0 ]]; then
    echo "WARN: $PENDING_SQL pending migration file(s) exist; pending SQL is not treated as production schema."
    WARN=$((WARN + 1))
  else
    echo "OK: No pending SQL migrations"
  fi
fi

if [[ -f "lib/registry/programs.ts" && -d "data/programs" ]]; then
  PROGRAM_COUNT=$(find data/programs -type f -name '*.ts' ! -name 'index.ts' 2>/dev/null | wc -l | tr -d ' ')
  echo "OK: canonical static program registry present ($PROGRAM_COUNT program data files)"
else
  echo "FAIL: canonical program registry/data is incomplete"
  FAIL=$((FAIL + 1))
fi

if [[ -d "lib/operations" ]]; then
  echo "FAIL: obsolete unused lib/operations authoritative-layer code still exists"
  FAIL=$((FAIL + 1))
else
  echo "OK: obsolete operations-layer code removed"
fi

if find supabase/migrations/pending -type f -name '*authoritative_data_layer*.sql' -print -quit 2>/dev/null | grep -q .; then
  echo "FAIL: obsolete authoritative_data_layer pending migration remains"
  FAIL=$((FAIL + 1))
else
  echo "OK: no obsolete authoritative-layer migration remains"
fi

section "SECTION 4: PUBLIC UX, MEDIA, AND NAVIGATION"

run "Public UX/media acceptance" node scripts/audit-public-site-media-nav.mjs
run "Canonical link integrity" pnpm run integrity:links
run "Canonical media integrity" pnpm run integrity:media

section "SECTION 5: PLACEHOLDER AND DEMO-CONTENT BLOCKERS"

SCAN_DIRS=()
for dir in apps/marketing/app apps/lms/app apps/admin/app components data lib; do
  [[ -d "$dir" ]] && SCAN_DIRS+=("$dir")
done

PLACEHOLDER_FOUND=0
for pattern in \
  "555-1234" \
  "555-0000" \
  "xxx-xxx-xxxx" \
  "000-000-0000" \
  "(555) 123-4567" \
  "555-4567" \
  "555-0147" \
  "Indianapolis, IN 21044" \
  "MD 21044"; do
  if grep -RFnF \
      --exclude='*.test.*' \
      --exclude='*.spec.*' \
      --exclude='*.snap' \
      --exclude-dir='__tests__' \
      --exclude-dir='fixtures' \
      -- "$pattern" "${SCAN_DIRS[@]}" 2>/dev/null \
      | grep -v 'placeholder=' \
      | grep -q .; then
    echo "FAIL: production placeholder found: $pattern"
    PLACEHOLDER_FOUND=1
    FAIL=$((FAIL + 1))
  fi
done

if [[ "$PLACEHOLDER_FOUND" -eq 0 ]]; then
  echo "OK: no high-confidence production phone/address placeholders"
fi

if grep -RniF \
    --exclude='*.test.*' \
    --exclude='*.spec.*' \
    --exclude-dir='__tests__' \
    --exclude-dir='fixtures' \
    -- 'example.com' "${SCAN_DIRS[@]}" 2>/dev/null \
    | grep -E 'email|mailto|contact' \
    | grep -q .; then
  echo "WARN: example.com appears near production contact/email code; review required"
  WARN=$((WARN + 1))
else
  echo "OK: no obvious example.com contact placeholders"
fi

if grep -RniE \
    --exclude='*.test.*' \
    --exclude='*.spec.*' \
    --exclude-dir='__tests__' \
    --exclude-dir='fixtures' \
    'fake success|simulat(e|ed|ion).*(success|production)|mock production|demo success' \
    apps/marketing/app apps/lms/app apps/admin/app 2>/dev/null \
    | grep -q .; then
  echo "FAIL: simulated/fake production-success behavior remains in deployed app source"
  FAIL=$((FAIL + 1))
else
  echo "OK: no obvious fake production-success markers"
fi

section "SECTION 6: STRIPE AND COMMERCIAL ROUTES"

if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "OK: Stripe secret key is available to this gate"
  run "Stripe route/webhook integrity" pnpm run integrity:stripe
else
  echo "WARN: Stripe secret key unavailable in this execution context"
  WARN=$((WARN + 1))
fi

if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  echo "OK: Stripe webhook secret is available to this gate"
else
  echo "WARN: Stripe webhook secret unavailable in this execution context"
  WARN=$((WARN + 1))
fi

section "SECTION 7: DEV STUDIO AND ADMIN OPERATIONS"

if [[ -f "scripts/dev-studio-integration-gate.sh" ]]; then
  run "Dev Studio integration" bash scripts/dev-studio-integration-gate.sh
else
  echo "FAIL: Dev Studio integration gate missing"
  FAIL=$((FAIL + 1))
fi

if [[ -f "lib/studio/command-allowlist.ts" ]]; then
  echo "OK: Studio command allowlist exists"
else
  echo "FAIL: Studio command allowlist missing"
  FAIL=$((FAIL + 1))
fi

section "SECTION 8: OPTIONAL EXPENSIVE CHECKS"

if [[ "${SKIP_BUILD_GATE:-0}" == "1" ]]; then
  echo "OK: build gate intentionally skipped here; dedicated CI/container workflows own builds"
else
  run "Typecheck/lint safety" pnpm run check:all
fi

section "PRODUCTION READINESS SUMMARY"
echo "Blocking failures: $FAIL"
echo "Warnings: $WARN"

echo ""
if [[ "$FAIL" -gt 0 ]]; then
  echo "PRODUCTION GATE FAILED"
  exit 1
fi

if [[ "$WARN" -gt 0 ]]; then
  echo "PRODUCTION GATE PASSED WITH WARNINGS"
  exit 0
fi

echo "PRODUCTION GATE PASSED"
exit 0
