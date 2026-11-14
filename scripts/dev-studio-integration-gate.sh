#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0
PASS=0

pass() { echo "[PASS] $1"; PASS=$((PASS + 1)); }
fail() { echo "[FAIL] $1"; FAIL=$((FAIL + 1)); }

CANONICAL="$ROOT/apps/admin/app/api/admin/dev-studio"
LEGACY_ADMIN="$ROOT/apps/admin/app/api/devstudio"
LEGACY_APP="$ROOT/apps/app/api/devstudio"

echo "=== Dev Studio Production Integration Gate ==="

echo "\n== Architecture convergence =="
if node scripts/check-studio-architecture.mjs; then
  pass "Canonical Studio architecture gate"
else
  fail "Canonical Studio architecture gate"
fi

echo "\n== Canonical API ownership =="
if [[ -d "$CANONICAL" ]] && [[ -n "$(find "$CANONICAL" -name route.ts -type f -print -quit)" ]]; then
  pass "Admin owns canonical /api/admin/dev-studio"
else
  fail "Missing canonical Admin Dev Studio API tree"
fi

for route in env devcontainer container-env; do
  if [[ -f "$CANONICAL/$route/route.ts" ]]; then
    pass "Canonical $route route exists"
  else
    fail "Canonical $route route is missing"
  fi

  if [[ -f "$LEGACY_ADMIN/$route/route.ts" ]]; then
    fail "Legacy /api/devstudio/$route alias reintroduced"
  else
    pass "Legacy /api/devstudio/$route alias absent"
  fi

  if [[ -f "$LEGACY_APP/$route/route.ts" ]]; then
    fail "Historical apps/app /api/admin/dev-studio/$route implementation reintroduced"
  else
    pass "Historical apps/app $route implementation absent"
  fi
done

echo "\n== Active UI wiring =="
PANEL="$ROOT/components/studio/DevContainerPanel.tsx"
if [[ -f "$PANEL" ]]; then
  if grep -q "'/api/admin/dev-studio/devcontainer'" "$PANEL" && \
     grep -q "'/api/admin/dev-studio/env'" "$PANEL" && \
     grep -q "'/api/admin/dev-studio/container-env'" "$PANEL"; then
    pass "Container panel calls canonical Admin APIs"
  else
    fail "Container panel is not fully wired to canonical Admin APIs"
  fi

  if grep -qE "['\"]/api/devstudio/(devcontainer|env|container-env)" "$PANEL"; then
    fail "Container panel still references legacy Dev Studio API paths"
  else
    pass "Container panel has no legacy env/devcontainer API references"
  fi
else
  fail "DevContainerPanel is missing"
fi

echo "\n== Repository workspace =="
[[ -f "$ROOT/components/studio/RepositoryLivePreview.tsx" ]] && pass "Repository live preview present" || fail "Repository live preview missing"
[[ -f "$ROOT/components/studio/RepositoryStudioWorkspace.tsx" ]] && pass "Unified repository workspace present" || fail "Unified repository workspace missing"

if grep -q "method: updating ? 'PUT' : 'POST'" "$ROOT/components/studio/DevStudioEditorWorkspace.tsx"; then
  pass "Repository commits distinguish update vs create"
else
  fail "Repository editor create/update commit contract is broken"
fi

echo "\n== Course Builder schema contract =="
COURSE_HEALTH="$CANONICAL/courses/health/route.ts"
if [[ -f "$COURSE_HEALTH" ]] && grep -q "from('course_modules')" "$COURSE_HEALTH" && grep -q "from('course_lessons')" "$COURSE_HEALTH"; then
  pass "Course health checks canonical course tables"
else
  fail "Course health does not check course_modules + course_lessons"
fi

if grep -Rqs "from('lessons').select('id').limit(1)" "$CANONICAL"; then
  fail "Legacy lessons table is still treated as canonical by Studio health"
else
  pass "Legacy lessons table is not treated as canonical"
fi

echo "\n== Canonical service origins =="
if grep -q "NEXT_PUBLIC_APP_URL=https://app.elevateforhumanity.org" .env.production.example && \
   grep -q "NEXT_PUBLIC_ADMIN_URL=https://admin.elevateforhumanity.org" .env.production.example && \
   grep -q "NEXT_PUBLIC_CANONICAL_DOMAIN=elevateforhumanity.org" .env.production.example; then
  pass "Canonical service origins documented"
else
  fail "Canonical service origins are incomplete"
fi

if grep -q "lms.elevateforhumanity.org" scripts/northflank/configure-domains.ts scripts/northflank/print-cname-targets.ts 2>/dev/null; then
  fail "Retired lms.elevateforhumanity.org remains in active Northflank scripts"
else
  pass "Northflank scripts use canonical app.elevateforhumanity.org"
fi

echo "\n== Database hardening migrations =="
[[ -f "$ROOT/supabase/migrations/20260812024000_admin_approve_progress_entries_audit.sql" ]] && pass "Audited apprenticeship approval migration tracked" || fail "Apprenticeship approval migration missing"
[[ -f "$ROOT/supabase/migrations/20260812024500_platform_secrets_scope.sql" ]] && pass "Canonical secret scope migration tracked" || fail "Secret scope migration missing"
[[ -f "$ROOT/supabase/migrations/20260812025000_backfill_platform_secrets_from_legacy.sql" ]] && pass "Legacy secret backfill migration tracked" || fail "Secret backfill migration missing"
[[ -f "$ROOT/supabase/migrations/20260818221500_dev_studio_claim_evidence_and_benchmarks.sql" ]] && pass "Dev Studio claim evidence migration tracked" || fail "Dev Studio claim evidence migration missing"

echo "\n== Evidence-backed public claims =="
if node scripts/check-dev-studio-claims.mjs; then
  pass "Dev Studio public claim evidence gate"
else
  fail "Dev Studio public claim evidence gate"
fi

echo "\n== Result =="
echo "Passes: $PASS"
echo "Failures: $FAIL"

if [[ "$FAIL" -gt 0 ]]; then
  echo "Dev Studio integration gate FAILED"
  exit 1
fi

echo "Dev Studio integration gate PASSED"
