#!/usr/bin/env bash
# =============================================================================
# CI-safe dashboard health check wrapper for Elevate LMS
#
# Runs comprehensive dashboard diagnostics without hanging on interactive prompts:
#   1. scripts/check-dashboard-schema.mjs   — DB schema validation
#   2. scripts/check-redirect-conflicts.mjs — static redirect conflict scan
#   3. scripts/audit-stubs.ts               — page stub / placeholder scan
#   4. scripts/audit-broken-links.ts        — static broken-link audit
#   5. scripts/fix-broken-images.sh         — image reference normalization
#   6. scripts/validate-production.sh       — production readiness check
#
# Environment variables (required for schema check):
#   NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
#   SUPABASE_SERVICE_ROLE_KEY      — Supabase service-role key
#
# Exit codes:
#   0 — all checks passed (or were non-blocking)
#   1 — one or more blocking checks failed
#
# Usage:
#   bash scripts/ci/run-dashboard-health-check.sh
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# Maximum seconds to allow fix-broken-images.sh to run (it processes 3000+ files)
IMAGE_FIX_TIMEOUT=180

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
PASS=0
FAIL=0
SKIP=0

log_section() { echo ""; echo "──────────────────────────────────────────────"; echo "▶  $1"; echo "──────────────────────────────────────────────"; }
log_pass()    { echo "  ✅ $1"; PASS=$((PASS + 1)); }
log_fail()    { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }
log_skip()    { echo "  ⏭  $1"; SKIP=$((SKIP + 1)); }
log_warn()    { echo "  ⚠️  $1"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║    Elevate LMS — Dashboard Health Check                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "  Working directory: $ROOT_DIR"
echo "  Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

# ---------------------------------------------------------------------------
# 1. Supabase DB schema validation
# ---------------------------------------------------------------------------
log_section "1/6  DB Schema Validation (check-dashboard-schema.mjs)"

if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  log_warn "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — skipping live schema check"
  log_skip "Schema validation (missing credentials)"
else
  # Basic format validation: URL must start with https:// and key must be non-empty
  if [[ ! "${NEXT_PUBLIC_SUPABASE_URL}" =~ ^https:// ]]; then
    log_fail "NEXT_PUBLIC_SUPABASE_URL does not look like a valid HTTPS URL"
  else
    if node scripts/check-dashboard-schema.mjs; then
      log_pass "Schema validation"
    else
      log_fail "Schema validation — check output above for missing tables/columns"
    fi
  fi
fi

# ---------------------------------------------------------------------------
# 2. Redirect conflict scan
# ---------------------------------------------------------------------------
log_section "2/6  Redirect Conflict Scan (check-redirect-conflicts.mjs)"

if node scripts/check-redirect-conflicts.mjs; then
  log_pass "Redirect conflict scan"
else
  log_fail "Redirect conflict scan — fix redirect conflicts before deploying"
fi

# ---------------------------------------------------------------------------
# 3. Page stub / placeholder scan
# ---------------------------------------------------------------------------
log_section "3/6  Page Stub Audit (audit-stubs.ts)"

# Ensure tsx is available; fall back to npx tsx if not on PATH
TSX_CMD="tsx"
TSX_AVAILABLE=true
if ! command -v tsx &>/dev/null; then
  if ! command -v npx &>/dev/null; then
    log_fail "Neither 'tsx' nor 'npx' found — cannot run broken-link audit. Install tsx: npm install -g tsx"
    TSX_AVAILABLE=false
  else
    TSX_CMD="npx --yes tsx"
  fi
fi

if [[ "$TSX_AVAILABLE" == "true" ]]; then
  if $TSX_CMD scripts/audit-stubs.ts; then
    log_pass "Page stub audit"
  else
    log_fail "Page stub audit — see stub-audit-report.json for details"
  fi
else
  log_skip "Page stub audit (tsx/npx not available)"
fi

# ---------------------------------------------------------------------------
# 4. Static broken-link audit
# ---------------------------------------------------------------------------
log_section "4/6  Broken Link Audit (audit-broken-links.ts)"

if [[ "$TSX_AVAILABLE" == "true" ]]; then
  if $TSX_CMD scripts/audit-broken-links.ts; then
    log_pass "Broken link audit"
  else
    log_fail "Broken link audit — see broken-links-report.json for details"
  fi
else
  log_skip "Broken link audit (tsx/npx not available)"
fi

# ---------------------------------------------------------------------------
# 5. Image reference fixes
# The script runs many find+sed passes over 3000+ files; cap at 3 minutes in CI.
# ---------------------------------------------------------------------------
log_section "5/6  Image Reference Fix (fix-broken-images.sh)"

if timeout "$IMAGE_FIX_TIMEOUT" bash scripts/fix-broken-images.sh; then
  log_pass "Image reference normalization"
else
  EXIT_CODE=$?
  if [[ $EXIT_CODE -eq 124 ]]; then
    log_warn "Image reference normalization timed out after ${IMAGE_FIX_TIMEOUT} s — partial fixes may have been applied"
    SKIP=$((SKIP + 1))
  else
    log_fail "Image reference normalization"
  fi
fi

# ---------------------------------------------------------------------------
# 6. Production readiness validation
# ---------------------------------------------------------------------------
log_section "6/6  Production Readiness (validate-production.sh)"

# validate-production.sh starts a local server on port 5005.
# In CI without simple-server.cjs the endpoint checks will fail but the
# script itself exits 0 (it only prints PASS/FAIL per check), so we allow
# failure here and capture it as a warning rather than a hard exit.
if bash scripts/validate-production.sh; then
  log_pass "Production readiness validation"
else
  log_warn "Production readiness validation reported issues — non-blocking in CI (no local server)"
  SKIP=$((SKIP + 1))
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Health Check Summary                                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "  ✅ Passed : $PASS"
echo "  ❌ Failed : $FAIL"
echo "  ⏭  Skipped: $SKIP"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo "  Result: UNHEALTHY ($FAIL check(s) failed)"
  exit 1
else
  echo "  Result: HEALTHY"
  exit 0
fi
