#!/usr/bin/env bash
# =============================================================================
# DEV STUDIO PRODUCTION INTEGRATION GATE
# =============================================================================
# Production ownership is defined by docs/audits/FULL-REPOSITORY-CENSUS-2026-08-08.md:
#   apps/marketing = public website
#   apps/lms       = learner/runtime portals
#   apps/admin     = staff/admin, Studio, Course Builder
#
# The historical apps/app tree is not a deployed production service and must
# never be treated as the canonical Dev Studio owner by this gate.
# =============================================================================

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0
WARN=0
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; WARN=$((WARN + 1)); }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; FAIL=$((FAIL + 1)); }

PRODUCTION_API_DIRS=(
  "$ROOT/apps/marketing/app/api"
  "$ROOT/apps/lms/app/api"
  "$ROOT/apps/admin/app/api"
)
ADMIN_DEVSTUDIO_DIR="$ROOT/apps/admin/app/api/devstudio"
LEGACY_DEVSTUDIO_DIR="$ROOT/apps/app/api/devstudio"

api_path() {
  echo "$1" | sed \
    -e "s|$ROOT/apps/marketing/app/api/||" \
    -e "s|$ROOT/apps/lms/app/api/||" \
    -e "s|$ROOT/apps/admin/app/api/||" \
    -e "s|/route\.ts$||"
}

echo "=== Dev Studio Production Integration Gate ==="

echo ""
echo "=============================================="
echo "SECTION 1: PRODUCTION API OWNERSHIP"
echo "=============================================="

ADMIN_COUNT=0
if [[ -d "$ADMIN_DEVSTUDIO_DIR" ]]; then
  ADMIN_COUNT=$(find "$ADMIN_DEVSTUDIO_DIR" -name 'route.ts' -type f 2>/dev/null | wc -l | tr -d ' ')
fi

if [[ "$ADMIN_COUNT" -gt 0 ]]; then
  log_pass "Admin owns active Dev Studio APIs ($ADMIN_COUNT routes)"
else
  log_fail "No Admin Dev Studio APIs found at apps/admin/app/api/devstudio"
fi

for dir in "$ROOT/apps/marketing/app/api/devstudio" "$ROOT/apps/lms/app/api/devstudio"; do
  count=0
  if [[ -d "$dir" ]]; then
    count=$(find "$dir" -name 'route.ts' -type f 2>/dev/null | wc -l | tr -d ' ')
  fi
  if [[ "$count" -gt 0 ]]; then
    log_fail "Dev Studio APIs must not be owned by $(echo "$dir" | sed "s|$ROOT/||"): $count route(s)"
  fi
done

LEGACY_COUNT=0
if [[ -d "$LEGACY_DEVSTUDIO_DIR" ]]; then
  LEGACY_COUNT=$(find "$LEGACY_DEVSTUDIO_DIR" -name 'route.ts' -type f 2>/dev/null | wc -l | tr -d ' ')
fi
if [[ "$LEGACY_COUNT" -gt 0 ]]; then
  log_warn "Historical apps/app Dev Studio tree still contains $LEGACY_COUNT route(s); it is non-production and must not be used as runtime ownership"
fi

echo ""
echo "=============================================="
echo "SECTION 2: ADMIN DEV STUDIO AUTHORIZATION"
echo "=============================================="

if [[ -d "$ADMIN_DEVSTUDIO_DIR" ]]; then
  while IFS= read -r route_file; do
    rel="/api/$(api_path "$route_file")"
    if grep -qE 'apiRequireDevStudio|apiRequireAdmin|apiRequireRole|requireAdmin|requireRole' "$route_file" 2>/dev/null; then
      log_pass "$rel has an authorization guard"
    elif grep -qE '^export[[:space:]]+\{.*(GET|POST|PUT|PATCH|DELETE)' "$route_file" 2>/dev/null; then
      log_pass "$rel delegates to a shared route implementation"
    else
      log_fail "$rel is missing an explicit authorization guard or guarded delegate"
    fi
  done < <(find "$ADMIN_DEVSTUDIO_DIR" -name 'route.ts' -type f 2>/dev/null | sort)
fi

echo ""
echo "=============================================="
echo "SECTION 3: COURSE BUILDER OWNERSHIP"
echo "=============================================="

if [[ -f "$ROOT/apps/admin/app/course-builder/page.tsx" ]]; then
  log_pass "Admin Course Builder page is present at /course-builder"
else
  log_fail "Canonical Admin Course Builder page is missing"
fi

if [[ -e "$ROOT/apps/marketing/app/admin/course-builder" ]] || [[ -e "$ROOT/apps/lms/app/admin/course-builder" ]]; then
  log_fail "Legacy nested /admin/course-builder implementation exists outside Admin"
fi

echo ""
echo "=============================================="
echo "SECTION 4: PRODUCTION HEALTH CONTRACTS"
echo "=============================================="

for app in marketing lms admin; do
  for endpoint in ping health version; do
    file="$ROOT/apps/$app/app/api/$endpoint/route.ts"
    if [[ -f "$file" ]]; then
      log_pass "$app /api/$endpoint present"
    else
      log_fail "$app /api/$endpoint missing"
    fi
  done
done

echo ""
echo "=============================================="
echo "SECTION 5: FORBIDDEN SECRET PATTERNS"
echo "=============================================="

SECRETS_FOUND=0
for dir in "${PRODUCTION_API_DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r file; do
    if grep -qE "password[[:space:]]*=[[:space:]]*['\"][^'\"]{8,}" "$file" 2>/dev/null; then
      log_fail "Possible hard-coded password in ${file#$ROOT/}"
      SECRETS_FOUND=$((SECRETS_FOUND + 1))
    fi
  done < <(find "$dir" -name '*.ts' -type f ! -name '*.test.ts' 2>/dev/null)
done
if [[ "$SECRETS_FOUND" -eq 0 ]]; then
  log_pass "No hard-coded password pattern found in production API routes"
fi

echo ""
echo "=============================================="
echo "SECTION 6: COMMAND EXECUTION CONTROLS"
echo "=============================================="

if [[ -f "$ROOT/lib/devstudio/command-allowlist.ts" ]] || [[ -f "$ROOT/lib/studio/allowed-commands.ts" ]]; then
  log_pass "Command allowlist/control file present"
else
  log_warn "No dedicated command allowlist file found; verify command execution remains constrained by Dev Studio guards"
fi

echo ""
echo "=============================================="
echo "SECTION 7: DEPLOYMENT API AUTHORIZATION"
echo "=============================================="

DEPLOY_COUNT=0
for dir in "${PRODUCTION_API_DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r file; do
    DEPLOY_COUNT=$((DEPLOY_COUNT + 1))
    rel="/api/$(api_path "$file")"
    if grep -qE 'apiRequireDevStudio|apiRequireAdmin|apiRequireRole|requireAdmin|requireRole' "$file" 2>/dev/null; then
      log_pass "$rel has deployment authorization"
    else
      log_fail "$rel is a deployment API without an explicit authorization guard"
    fi
  done < <(find "$dir" \( -path '*/deploy/route.ts' -o -path '*/deployment/route.ts' \) -type f 2>/dev/null)
done
if [[ "$DEPLOY_COUNT" -eq 0 ]]; then
  log_info "No in-app deployment endpoints found"
fi

echo ""
echo "=============================================="
echo "SECTION 8: ENVIRONMENT DOCUMENTATION"
echo "=============================================="

REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  GITHUB_REPOSITORY
  NORTHFLANK_MARKETING_SERVICE_ID
  STRIPE_WEBHOOK_SECRET_APPLICATION_FEE
  STRIPE_WEBHOOK_SECRET_HOST_SHOP
  STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS
)

for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "^${var}=" .env.example .env.required.example 2>/dev/null; then
    log_pass "$var documented"
  else
    log_fail "$var is referenced by runtime/deployment code but not documented"
  fi
done

echo ""
echo "=============================================="
echo "DEV STUDIO PRODUCTION GATE SUMMARY"
echo "=============================================="
echo "Blocking Failures: $FAIL"
echo "Warnings: $WARN"

if [[ "$FAIL" -gt 0 ]]; then
  echo -e "${RED}❌ GATE FAILED${NC}"
  exit 1
fi

if [[ "$WARN" -gt 0 ]]; then
  echo -e "${YELLOW}⚠️  GATE PASSED WITH WARNINGS${NC}"
  exit 0
fi

echo -e "${GREEN}✅ GATE PASSED${NC}"
exit 0
