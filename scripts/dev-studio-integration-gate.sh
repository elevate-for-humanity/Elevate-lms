#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0
WARN=0
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info(){ echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass(){ echo -e "${GREEN}[PASS]${NC} $1"; }
log_warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; WARN=$((WARN+1)); }
log_fail(){ echo -e "${RED}[FAIL]${NC} $1"; FAIL=$((FAIL+1)); }

PRODUCTION_API_DIRS=("$ROOT/apps/marketing/app/api" "$ROOT/apps/lms/app/api" "$ROOT/apps/admin/app/api")
CANONICAL_STUDIO_API="$ROOT/apps/admin/app/api/admin/dev-studio"
COMPAT_STUDIO_API="$ROOT/apps/admin/app/api/devstudio"
LEGACY_STUDIO_API="$ROOT/apps/app/api/devstudio"

echo "=== Dev Studio Production Integration Gate ==="

echo "\n== 1. CANONICAL OWNERSHIP =="
if [[ -d "$CANONICAL_STUDIO_API" ]]; then
  count=$(find "$CANONICAL_STUDIO_API" -name route.ts -type f | wc -l | tr -d ' ')
  [[ "$count" -gt 0 ]] && log_pass "Admin owns canonical /api/admin/dev-studio ($count routes)" || log_fail "Canonical Studio API tree is empty"
else
  log_fail "Missing apps/admin/app/api/admin/dev-studio"
fi

for dir in "$ROOT/apps/marketing/app/api/devstudio" "$ROOT/apps/lms/app/api/devstudio" "$ROOT/apps/marketing/app/api/admin/dev-studio" "$ROOT/apps/lms/app/api/admin/dev-studio"; do
  if [[ -d "$dir" ]] && find "$dir" -name route.ts -type f | grep -q .; then
    log_fail "Studio production API ownership leaked outside Admin: ${dir#$ROOT/}"
  fi
done

if [[ -d "$LEGACY_STUDIO_API" ]] && find "$LEGACY_STUDIO_API" -name route.ts -type f | grep -q .; then
  log_warn "Historical apps/app Dev Studio routes remain; they are non-production and must have no unique capability ownership"
else
  log_pass "Migrated Dev Studio capabilities removed from historical apps/app tree"
fi

for alias in devcontainer env container-env; do
  f="$COMPAT_STUDIO_API/$alias/route.ts"
  if [[ -f "$f" ]] && grep -q "api/admin/dev-studio/$alias/route" "$f"; then
    log_pass "/api/devstudio/$alias is a thin compatibility delegate"
  else
    log_fail "Missing/thick compatibility delegate for /api/devstudio/$alias"
  fi
done

echo "\n== 2. AUTHORIZATION =="
if [[ -d "$CANONICAL_STUDIO_API" ]]; then
  while IFS= read -r f; do
    if grep -qE 'apiRequireDevStudio|apiRequireAdmin|apiRequireRole|requireAdmin|requireRole|capabilityHealthResponse' "$f"; then
      log_pass "${f#$ROOT/} has guarded execution"
    elif grep -qE '^export[[:space:]]+\{.*(GET|POST|PUT|PATCH|DELETE)' "$f"; then
      log_pass "${f#$ROOT/} delegates execution"
    else
      log_fail "${f#$ROOT/} is missing an explicit guard or guarded delegate"
    fi
  done < <(find "$CANONICAL_STUDIO_API" -name route.ts -type f | sort)
fi

# The public compatibility family can include older routes, but all mutating files
# must either guard locally or delegate to a canonical guarded implementation.
if [[ -d "$COMPAT_STUDIO_API" ]]; then
  while IFS= read -r f; do
    if grep -qE 'export async function (POST|PUT|PATCH|DELETE)|export const (POST|PUT|PATCH|DELETE)|export \{.*(POST|PUT|PATCH|DELETE)' "$f"; then
      if grep -qE 'apiRequireDevStudio|apiRequireAdmin|apiRequireRole|requireAdmin|requireRole|from .*/api/admin/dev-studio/' "$f"; then
        log_pass "${f#$ROOT/} mutation is guarded/delegated"
      else
        log_fail "${f#$ROOT/} exposes a Studio mutation without a guard/delegate"
      fi
    fi
  done < <(find "$COMPAT_STUDIO_API" -name route.ts -type f | sort)
fi

echo "\n== 3. COURSE BUILDER =="
[[ -f "$ROOT/apps/admin/app/course-builder/page.tsx" ]] && log_pass "Canonical /course-builder page present" || log_fail "Canonical /course-builder page missing"
[[ -f "$ROOT/apps/admin/app/api/admin/course-builder/course/route.ts" ]] && log_pass "Canonical Course Builder workspace API present" || log_fail "Course Builder workspace API missing"
COURSE_HEALTH="$ROOT/apps/admin/app/api/admin/dev-studio/courses/health/route.ts"
if [[ -f "$COURSE_HEALTH" ]] && grep -q "from('course_lessons')" "$COURSE_HEALTH" && grep -q "from('course_modules')" "$COURSE_HEALTH"; then
  log_pass "Course health probes canonical course_modules + course_lessons tables"
else
  log_fail "Course health is not aligned with canonical Course Builder tables"
fi
if grep -Rqs "from('lessons').select('id').limit(1)" "$ROOT/apps/admin/app/api/admin/dev-studio"; then
  log_fail "Studio health still uses legacy lessons table"
else
  log_pass "Studio health does not probe legacy lessons as canonical"
fi

echo "\n== 4. REPOSITORY EDITOR / LIVE PREVIEW =="
[[ -f "$ROOT/components/studio/RepositoryLivePreview.tsx" ]] && log_pass "Repository live-preview component present" || log_fail "Repository live-preview component missing"
[[ -f "$ROOT/components/studio/RepositoryStudioWorkspace.tsx" ]] && log_pass "Unified repository workspace present" || log_fail "Unified repository workspace missing"
if grep -q "method: updating ? 'PUT' : 'POST'" "$ROOT/components/studio/DevStudioEditorWorkspace.tsx"; then
  log_pass "Repository editor distinguishes updates from creates"
else
  log_fail "Repository editor commit method is not update/create safe"
fi

echo "\n== 5. SERVICE ORIGINS / DNS OWNERSHIP =="
if grep -q "NEXT_PUBLIC_CANONICAL_DOMAIN=elevateforhumanity.org" .env.production.example && \
   grep -q "NEXT_PUBLIC_APP_URL=https://app.elevateforhumanity.org" .env.production.example && \
   grep -q "NEXT_PUBLIC_ADMIN_URL=https://admin.elevateforhumanity.org" .env.production.example; then
  log_pass "Canonical production service origins are documented"
else
  log_fail "Production service origins are incomplete or malformed"
fi
if grep -q "app.elevateforhumanity.org" scripts/northflank/configure-domains.ts && \
   grep -q "www.elevateforhumanity.org" scripts/northflank/configure-domains.ts && \
   grep -q "admin.elevateforhumanity.org" scripts/northflank/configure-domains.ts; then
  log_pass "Northflank domain script contains all three canonical hosts"
else
  log_fail "Northflank domain script is missing canonical host ownership"
fi
if grep -q "lms.elevateforhumanity.org" scripts/northflank/configure-domains.ts scripts/northflank/print-cname-targets.ts 2>/dev/null; then
  log_fail "Active Northflank scripts still reference retired lms.elevateforhumanity.org"
else
  log_pass "Active Northflank scripts use app.elevateforhumanity.org"
fi
if grep -Rqs "admin\.www\.elevateforhumanity\.org" apps lib components scripts --exclude-dir=node_modules; then
  log_fail "Malformed admin.www hostname remains in active code"
else
  log_pass "No active admin.www hostname found"
fi

echo "\n== 6. HEALTH CONTRACTS =="
for app in marketing lms admin; do
  for endpoint in ping health version; do
    f="$ROOT/apps/$app/app/api/$endpoint/route.ts"
    [[ -f "$f" ]] && log_pass "$app /api/$endpoint present" || log_fail "$app /api/$endpoint missing"
  done
done

echo "\n== 7. SECRET / CONTAINER CONTROL PLANE =="
for route in env devcontainer container-env; do
  [[ -f "$CANONICAL_STUDIO_API/$route/route.ts" ]] && log_pass "Canonical Studio $route API present" || log_fail "Canonical Studio $route API missing"
done
[[ -f "$ROOT/supabase/migrations/20260812024500_platform_secrets_scope.sql" ]] && log_pass "Canonical secret-scope migration tracked" || log_fail "Secret-scope migration missing"
[[ -f "$ROOT/supabase/migrations/20260812025000_backfill_platform_secrets_from_legacy.sql" ]] && log_pass "Legacy secret backfill migration tracked" || log_fail "Secret backfill migration missing"

SECRETS_FOUND=0
for dir in "${PRODUCTION_API_DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r f; do
    if grep -qE "password[[:space:]]*=[[:space:]]*['\"][^'\"]{8,}" "$f" 2>/dev/null; then
      log_fail "Possible hard-coded password in ${f#$ROOT/}"
      SECRETS_FOUND=$((SECRETS_FOUND+1))
    fi
  done < <(find "$dir" -name '*.ts' -type f ! -name '*.test.ts')
done
[[ "$SECRETS_FOUND" -eq 0 ]] && log_pass "No hard-coded password pattern found in production APIs"

echo "\n== 8. REQUIRED ENV DOCUMENTATION =="
REQUIRED_VARS=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY GITHUB_REPO GITHUB_REPOSITORY NORTHFLANK_MARKETING_SERVICE_ID NORTHFLANK_LMS_SERVICE_ID NORTHFLANK_ADMIN_SERVICE_ID STRIPE_WEBHOOK_SECRET_APPLICATION_FEE STRIPE_WEBHOOK_SECRET_HOST_SHOP STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS)
for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "^${var}=" .env.example .env.required.example .env.production.example 2>/dev/null; then
    log_pass "$var documented"
  else
    log_fail "$var required by production code but not documented"
  fi
done

echo "\n== SUMMARY =="
echo "Blocking Failures: $FAIL"
echo "Warnings: $WARN"
if [[ "$FAIL" -gt 0 ]]; then echo -e "${RED}❌ GATE FAILED${NC}"; exit 1; fi
if [[ "$WARN" -gt 0 ]]; then echo -e "${YELLOW}⚠️ GATE PASSED WITH WARNINGS${NC}"; exit 0; fi
echo -e "${GREEN}✅ GATE PASSED${NC}"
