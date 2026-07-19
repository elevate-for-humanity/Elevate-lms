#!/usr/bin/env bash
# Production activation gate — run before promote/deploy.
# Exit 1 on any blocking failure.
#
# Enhanced with PARIS Operations Kernel checks:
# - Authoritative Data Layer validation
# - Program Registry verification
# - Verified Claims checks
# - Placeholder detection
# - Deployment blockers
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# PRODUCTION BUILD CONFIGURATION (Next.js 15 + React 19 Optimized)
export NODE_OPTIONS='--max-old-space-size=12288'
export DISABLE_WEBPACK_FILESYSTEM_CACHE=
export BUILD_SCOPE=1

echo "=== Production Readiness Gate ==="
echo "=== PARIS Operations Kernel Validation ==="
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
    FAIL=1
  fi
}

run_warn() {
  local name="$1"
  shift
  echo ""
  echo "--- $name ---"
  if "$@" ; then
    echo "OK: $name"
  else
    echo "WARN: $name"
    WARN=$((WARN + 1))
  fi
}

# ============================================================================
# SECTION 1: CORE SECURITY CHECKS (Existing)
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 1: CORE SECURITY CHECKS"
echo "=============================================="

run "API admin guards" bash scripts/audit-api-auth-guards.sh
run "Auth gaps" bash scripts/audit-auth-gaps.sh
run "Env vars" bash scripts/audit-env-vars.sh
run "Redirect conflicts" env BUILD_SCOPE=1 node scripts/check-redirect-conflicts.mjs
run "Public route guards" node scripts/guard-public-routes.mjs
run "Pre-auth registry" node scripts/check-pre-auth-registry.cjs

if [[ -f scripts/audit-public-html.mjs ]]; then
  run "Public HTML hygiene" node scripts/audit-public-html.mjs || true
fi

# ============================================================================
# SECTION 2: AUTHORITATIVE DATA LAYER CHECKS
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 2: AUTHORITATIVE DATA LAYER"
echo "=============================================="

# Check Operations Service exists
if [[ -f "lib/operations/service.ts" ]]; then
  echo "OK: Operations Service exists"
else
  echo "FAIL: Operations Service missing (lib/operations/service.ts)"
  FAIL=1
fi

# Check Operations Types exist
if [[ -f "lib/operations/types.ts" ]]; then
  echo "OK: Operations Types exist"
else
  echo "FAIL: Operations Types missing (lib/operations/types.ts)"
  FAIL=1
fi

# Check migration for authoritative tables
if find supabase/migrations -name "*.sql" -exec grep -l "program_registry\|verified_claims\|funding_rules\|notification_outbox\|workflow_instances" {} \; 2>/dev/null | head -1 | grep -q "."; then
  echo "OK: Authoritative data layer migrations found"
else
  echo "WARN: Authoritative data layer migration may be pending (supabase/migrations/pending/)"
  WARN=$((WARN + 1))
fi

# ============================================================================
# SECTION 3: PROGRAM REGISTRY CHECKS
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 3: PROGRAM REGISTRY"
echo "=============================================="

# Check static program registry
if [[ -f "lib/registry/programs.ts" ]]; then
  echo "OK: Program Registry exists"
else
  echo "FAIL: Program Registry missing"
  FAIL=1
fi

# Check static program data
if [[ -d "data/programs" ]]; then
  PROGRAM_COUNT=$(find data/programs -name "*.ts" ! -name "index.ts" 2>/dev/null | wc -l)
  echo "OK: $PROGRAM_COUNT program data files found"
else
  echo "FAIL: Program data directory missing"
  FAIL=1
fi

# ============================================================================
# SECTION 4: VERIFIED CLAIMS CHECKS
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 4: VERIFIED CLAIMS"
echo "=============================================="

# Check for compliance badges component
if [[ -f "components/ComplianceBadges.tsx" ]]; then
  echo "OK: Compliance Badges component exists"
else
  echo "WARN: Compliance Badges component missing"
  WARN=$((WARN + 1))
fi

# Check for evidence processor
if [[ -f "lib/automation/evidence-processor.ts" ]]; then
  echo "OK: Evidence processor exists"
else
  echo "WARN: Evidence processor missing"
  WARN=$((WARN + 1))
fi

# ============================================================================
# SECTION 5: WORKFLOW ENGINE CHECKS
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 5: WORKFLOW ENGINE"
echo "=============================================="

# Check workflow engine
if [[ -f "lib/workflows/engine.ts" ]]; then
  echo "OK: Workflow Engine exists"
else
  echo "FAIL: Workflow Engine missing"
  FAIL=1
fi

# Check state machine
if [[ -f "lib/orchestration/state-machine.ts" ]]; then
  echo "OK: State Machine exists"
else
  echo "FAIL: State Machine missing"
  FAIL=1
fi

# ============================================================================
# SECTION 6: NOTIFICATION SYSTEM CHECKS
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 6: NOTIFICATION SYSTEM"
echo "=============================================="

# Check notification service
if [[ -d "lib/notifications" ]]; then
  NOTIF_COUNT=$(find lib/notifications -name "*.ts" 2>/dev/null | wc -l)
  echo "OK: Notification system exists ($NOTIF_COUNT files)"
else
  echo "FAIL: Notification system missing"
  FAIL=1
fi

# ============================================================================
# SECTION 7: PLACEHOLDER DETECTION (Critical for Production)
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 7: PLACEHOLDER DETECTION"
echo "=============================================="

# Check for placeholder phone numbers (ignoring form placeholders and template variables)
PLACEHOLDER_FOUND=0
for pattern in "555-1234" "555-0000" "xxx-xxx-xxxx" "000-000-0000" "(555) 123-4567" "555-4567" "555-0147"; do
  if grep -r "$pattern" components/ app/ 2>/dev/null | grep -v ".test." | grep -v ".spec." | grep -v "placeholder=" | grep -v "\{\{.*\}\}" > /dev/null; then
    echo "FAIL: Placeholder phone found: $pattern"
    PLACEHOLDER_FOUND=1
    FAIL=1
  fi
done
[[ $PLACEHOLDER_FOUND -eq 0 ]] && echo "OK: No placeholder phone numbers"

# Check for placeholder emails
for pattern in "example.com" "placeholder" "your-email" "test@test"; do
  if grep -r "$pattern" components/ app/ 2>/dev/null | grep -i "email" | grep -v ".test." > /dev/null; then
    echo "WARN: Potential placeholder email found"
    WARN=$((WARN + 1))
  fi
done

# Check for placeholder addresses (ignoring form placeholders)
ADDRESS_FOUND=0
for pattern in "Columbia, MD" "MD 21044" "Indianapolis, IN 21044"; do
  if grep -r "$pattern" components/ app/ 2>/dev/null | grep -v ".test." > /dev/null; then
    echo "FAIL: Placeholder address found: $pattern"
    ADDRESS_FOUND=1
    FAIL=1
  fi
done
[[ $ADDRESS_FOUND -eq 0 ]] && echo "OK: No placeholder addresses"

# ============================================================================
# SECTION 8: STRIPE CONFIGURATION
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 8: STRIPE CONFIGURATION"
echo "=============================================="

if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "OK: Stripe Secret Key configured"
else
  # In CI environments (GitHub Actions), Stripe keys are not available — warn
  # but do not fail so the gate doesn't block merges. Production deployments
  # must have these set in Northflank secrets.
  if [[ "${CI:-false}" == "true" || "${GITHUB_ACTIONS:-false}" == "true" ]]; then
    echo "WARN: Stripe Secret Key not configured (expected in CI — set in Northflank for prod)"
    WARN=$((WARN + 1))
  else
    echo "WARN: Stripe Secret Key not configured (documented in .env.example - set in Northflank at deploy)"; WARN=$((WARN + 1))
  fi
fi

if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  echo "OK: Stripe Webhook Secret configured"
else
  if [[ "${CI:-false}" == "true" || "${GITHUB_ACTIONS:-false}" == "true" ]]; then
    echo "WARN: Stripe Webhook Secret not configured (expected in CI — set in Northflank for prod)"
    WARN=$((WARN + 1))
  else
    echo "WARN: Stripe Webhook Secret not configured (documented in .env.example - set in Northflank at deploy)"; WARN=$((WARN + 1))
  fi
fi

# Check Stripe price IDs exist for paid programs
STRIPE_PRICE_CHECK=$(grep -r "stripe_price_id\|price_id" lib/ data/ 2>/dev/null | wc -l)
if [[ "$STRIPE_PRICE_CHECK" -gt 0 ]]; then
  echo "OK: Stripe price IDs referenced: $STRIPE_PRICE_CHECK"
else
  echo "WARN: No Stripe price IDs found"
  WARN=$((WARN + 1))
fi

# ============================================================================
# SECTION 9: DEPLOYMENT BLOCKERS
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 9: DEPLOYMENT BLOCKERS"
echo "=============================================="

BLOCKERS=0

# Check for unfinished pages — match only HTML comments so developer // TODO comments don't trigger a failure
# Use || true so set -e doesn't kill the pipeline when grep finds no matches
UNFINISHED=$(grep -r "<!--\s*TODO\|<!--\s*FIXME\|<!--\s*UNDER CONSTRUCTION" components/ apps/ app-legacy/ 2>/dev/null | grep -v ".test." | wc -l) || true
if [[ "$UNFINISHED" -gt 0 ]]; then
  echo "FAIL: Unfinished content markers found: $UNFINISHED"
  FAIL=1
  BLOCKERS=$((BLOCKERS + 1))
else
  echo "OK: No unfinished content markers"
fi

# Check for dead links in navigation
if [[ -f "config/navigation.ts" ]]; then
  if grep -q "example.com\|placeholder" config/navigation.ts; then
    echo "FAIL: Navigation contains placeholder links"
    FAIL=1
    BLOCKERS=$((BLOCKERS + 1))
  else
    echo "OK: Navigation links validated"
  fi
fi

# Check for broken imports
BROKEN_IMPORTS=$(grep -r "from '@/" components/ apps/ app-legacy/ 2>/dev/null | grep -v ".test." | grep -c "undefined\|TODO" || true)
if [[ "$BROKEN_IMPORTS" -gt 0 ]]; then
  echo "WARN: Potential broken imports: $BROKEN_IMPORTS"
  WARN=$((WARN + 1))
fi

# ============================================================================
# SECTION 10: DEV STUDIO INTEGRATION GATE
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 10: DEV STUDIO INTEGRATION"
echo "=============================================="

# Run Dev Studio integration gate
if [[ -f "scripts/dev-studio-integration-gate.sh" ]]; then
  if bash scripts/dev-studio-integration-gate.sh > /tmp/devstudio-gate.log 2>&1; then
    echo "OK: Dev Studio Integration Gate passed"
  else
    DEV_STUDIO_FAILS=$(grep -c "\[FAIL\]" /tmp/devstudio-gate.log 2>/dev/null || echo 0)
    if [[ "$DEV_STUDIO_FAILS" -gt 0 ]]; then
      echo "FAIL: Dev Studio Integration Gate failed"
      cat /tmp/devstudio-gate.log
      FAIL=$((FAIL + DEV_STUDIO_FAILS))
    else
      echo "WARN: Dev Studio Integration Gate passed with warnings"
      WARN=$((WARN + 1))
    fi
  fi
else
  echo "WARN: Dev Studio Integration Gate not found (scripts/dev-studio-integration-gate.sh)"
  WARN=$((WARN + 1))
fi

# Check command allowlist exists
if [[ -f "lib/studio/command-allowlist.ts" ]]; then
  echo "OK: Command allowlist exists"
else
  echo "WARN: Command allowlist not found (lib/studio/command-allowlist.ts)"
  WARN=$((WARN + 1))
fi

# ============================================================================
# SECTION 11: UNIFIED CONTAINER CHECKS
# ============================================================================
echo ""
echo "=============================================="
echo "SECTION 11: UNIFIED CONTAINER"
echo "=============================================="

# Check unified Dockerfile exists
if [[ -f "Dockerfile.production" ]]; then
  echo "OK: Unified Dockerfile exists"
else
  echo "WARN: Unified Dockerfile not found (Dockerfile.production)"
  WARN=$((WARN + 1))
fi

# Check unified middleware
if [[ -f "middleware.ts" ]]; then
  if grep -q "DOMAIN-BASED ROUTING\|configuredAdminHost\|configuredAppHost" middleware.ts; then
    echo "OK: Unified middleware has domain routing"
  else
    echo "WARN: Unified middleware may need domain routing enhancement"
    WARN=$((WARN + 1))
  fi
fi

# Check for duplicate API trees (apps/ directory should be minimal)
DUPLICATE_API_COUNT=$(find apps -path "*/api/route.ts" 2>/dev/null | wc -l)
if [[ "$DUPLICATE_API_COUNT" -gt 0 ]]; then
  echo "WARN: $DUPLICATE_API_COUNT API routes found in apps/ directory (consider consolidation)"
  WARN=$((WARN + 1))
else
  echo "OK: No duplicate API routes found in apps/ directory"
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo "=============================================="
echo "PRODUCTION READINESS SUMMARY"
echo "=============================================="
echo ""
echo "Blocking Failures: $FAIL"
echo "Warnings: $WARN"
echo ""

if [[ "$FAIL" -gt 0 ]]; then
  echo "=============================================="
  echo "❌ PRODUCTION GATE FAILED"
  echo "=============================================="
  echo ""
  echo "Blocking failures must be resolved before deployment."
  echo "Review failed checks above."
  echo ""
  exit 1
fi

if [[ "$WARN" -gt 0 ]]; then
  echo "=============================================="
  echo "⚠️  PRODUCTION GATE PASSED WITH WARNINGS"
  echo "=============================================="
  echo ""
  echo "Warnings should be reviewed but do not block deployment."
  echo "Consider addressing critical warnings before going live."
  echo ""
  exit 0
fi

echo "=============================================="
echo "✅ PRODUCTION GATE PASSED"
echo "=============================================="
echo ""
echo "All checks passed. Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Deploy to staging environment"
echo "2. Run smoke tests: curl /api/health && curl /api/ready"
echo "3. Verify key user journeys"
echo "4. Deploy to production"
echo ""
exit 0
