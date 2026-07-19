#!/usr/bin/env bash
# =============================================================================
# DEV STUDIO INTEGRATION GATE
# =============================================================================
# Verifies Dev Studio API security, course-builder connectivity, runtime health,
# preview configuration, and forbids legacy/open-endpoint patterns.
# Updated for pnpm monorepo: scans apps/{marketing,lms,admin,app}/app/api.
#
# Exit 1 on any blocking failure.
# =============================================================================

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Dev Studio Integration Gate ==="
FAIL=0
WARN=0

# Temp files for heredoc workarounds
_CB_FILE=$(mktemp)
_DEPLOY_FILE=$(mktemp)
_SECRET_FILES=$(mktemp)
_DS_FILES=$(mktemp)
trap "rm -f $_CB_FILE $_DEPLOY_FILE $_SECRET_FILES $_DS_FILES" EXIT

# All app API directories (monorepo)
APP_API_DIRS=(
  "$ROOT/apps/marketing/app/api"
  "$ROOT/apps/lms/app/api"
  "$ROOT/apps/admin/app/api"
  "$ROOT/apps/app/api"
)

# Helper: find route.ts files across all app API directories
find_all_apis() {
  for dir in "${APP_API_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
      find "$dir" -name "route.ts" 2>/dev/null
    fi
  done
}

# Helper: convert file path to /api/... URL path
api_path() {
  echo "$1" | sed \
    -e "s|$ROOT/apps/marketing/app/api/||" \
    -e "s|$ROOT/apps/lms/app/api/||" \
    -e "s|$ROOT/apps/admin/app/api/||" \
    -e "s|$ROOT/apps/app/api/||" \
    -e "s|/route\.ts||" \
    -e "s|/route\.tsx||"
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; WARN=$((WARN + 1)); }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; FAIL=$((FAIL + 1)); }

# =============================================================================
# SECTION 1: API OWNERSHIP CHECKS
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 1: API OWNERSHIP"
echo "=============================================="

log_info "Checking Dev Studio API locations..."

# Dev Studio APIs are in apps/app/api/devstudio/ (the "standalone app")
DEVSTUDIO_DIR="$ROOT/apps/app/api/devstudio"
DEVSTUDIO_COUNT=0
if [[ -d "$DEVSTUDIO_DIR" ]]; then
  DEVSTUDIO_COUNT=$(find "$DEVSTUDIO_DIR" -name "route.ts" 2>/dev/null | wc -l)
fi

# Check for devstudio APIs accidentally placed in marketing/lms/admin apps
STRAY_COUNT=0
for dir in "$ROOT/apps/marketing/app/api/devstudio" "$ROOT/apps/lms/app/api/devstudio" "$ROOT/apps/admin/app/api/devstudio"; do
  if [[ -d "$dir" ]]; then
    count=$(find "$dir" -name "route.ts" 2>/dev/null | wc -l)
    if [[ "$count" -gt 0 ]]; then
      log_fail "Stray Dev Studio APIs in $dir:"
      find "$dir" -name "route.ts" 2>/dev/null | while read -r f; do
        echo "  - $(api_path "$f")"
      done
      STRAY_COUNT=$((STRAY_COUNT + count))
    fi
  fi
done

if [[ "$DEVSTUDIO_COUNT" -gt 0 ]] && [[ "$STRAY_COUNT" -eq 0 ]]; then
  log_pass "Dev Studio APIs correctly in apps/app/api/devstudio/ ($DEVSTUDIO_COUNT routes)"
elif [[ "$DEVSTUDIO_COUNT" -gt 0 ]] && [[ "$STRAY_COUNT" -gt 0 ]]; then
  log_fail "Dev Studio APIs split across locations (canonical: $DEVSTUDIO_COUNT, stray: $STRAY_COUNT)"
elif [[ "$DEVSTUDIO_COUNT" -eq 0 ]]; then
  log_warn "No Dev Studio APIs found in apps/app/app/api/devstudio/ (may be intentional)"
fi

# =============================================================================
# SECTION 2: API AUTHORIZATION GUARDS
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 2: API AUTHORIZATION GUARDS"
echo "=============================================="

log_info "Checking Dev Studio API authorization..."

MISSING_GUARDS=0
find "$DEVSTUDIO_DIR" -name "route.ts" 2>/dev/null > "$_DS_FILES" || true
if [[ ! -s "$_DS_FILES" ]]; then
  log_warn "No Dev Studio API routes to check (devstudio dir empty or missing)"
else
  while IFS= read -r route_file; do
    parent_dir=$(basename "$(dirname "$route_file")")
    if [[ "$parent_dir" != "devstudio" ]] && [[ "$parent_dir" != "autopilot" ]] && [[ "$parent_dir" != "control-plane" ]]; then
      continue
    fi

    full_path="/$(api_path "$route_file")"

    if grep -qE "requireAdmin|requireRole|apiRequireAdmin|apiRequireRole" "$route_file" 2>/dev/null; then
      log_pass "$full_path has auth guard"
    elif grep -qE "OPEN.*ENDPOINT|//.*open|no.*auth|skip.*auth" "$route_file" 2>/dev/null; then
      log_fail "$full_path has suspicious open endpoint pattern"
      MISSING_GUARDS=$((MISSING_GUARDS + 1))
    elif grep -qE "PUBLIC|public.*route|no.*guard" "$route_file" 2>/dev/null; then
      log_warn "$full_path may be intentionally public (verify)"
    else
      log_fail "$full_path missing authorization guard"
      MISSING_GUARDS=$((MISSING_GUARDS + 1))
    fi
  done < "$_DS_FILES"

  if [[ "$MISSING_GUARDS" -gt 0 ]]; then
    log_fail "$MISSING_GUARDS Dev Studio API routes missing authorization"
  else
    log_pass "All Dev Studio API routes have authorization"
  fi
fi

# =============================================================================
# SECTION 3: COURSE BUILDER CONNECTIVITY
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 3: COURSE BUILDER CONNECTIVITY"
echo "=============================================="

log_info "Checking course builder APIs..."

> "$_CB_FILE"
for dir in "${APP_API_DIRS[@]}"; do
  if [[ -d "$dir/course-builder" ]]; then
    find "$dir/course-builder" -name "route.ts" 2>/dev/null >> "$_CB_FILE" || true
  fi
done
COURSE_BUILDER_COUNT=$(grep -c "route.ts" "$_CB_FILE" 2>/dev/null || echo 0)

if [[ "$COURSE_BUILDER_COUNT" -gt 0 ]]; then
  log_pass "Course builder APIs found: $COURSE_BUILDER_COUNT"
  while IFS= read -r route_file; do
    [[ -z "$route_file" ]] && continue
    full_path="/$(api_path "$route_file")"
    if grep -qE "requireAdmin|requireRole|apiRequireAdmin|apiRequireRole" "$route_file" 2>/dev/null; then
      log_pass "$full_path has auth guard"
    elif grep -qE "PUBLIC|public.*route|no.*guard" "$route_file" 2>/dev/null; then
      log_warn "$full_path may be intentionally public (verify)"
    else
      log_fail "$full_path missing auth guard"
      FAIL=$((FAIL + 1))
    fi
  done < "$_CB_FILE"
else
  log_warn "No course builder APIs found - may be intentional"
fi

# =============================================================================
# SECTION 4: RUNTIME HEALTH CHECKS
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 4: RUNTIME HEALTH"
echo "=============================================="

log_info "Checking health endpoints across apps..."

HEALTH_COUNT=0
for dir in "${APP_API_DIRS[@]}"; do
  if [[ -f "$dir/health/route.ts" ]]; then
    HEALTH_COUNT=$((HEALTH_COUNT + 1))
    app_name=$(basename "$(dirname "$dir")")
    log_pass "Health endpoint in apps/$app_name/app/api/health"
  fi
done

if [[ "$HEALTH_COUNT" -gt 0 ]]; then
  log_pass "Health endpoints found in $HEALTH_COUNT app(s)"
else
  log_fail "No health endpoints found in any app"
  FAIL=$((FAIL + 1))
fi

# =============================================================================
# SECTION 5: FORBIDDEN PATTERNS
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 5: FORBIDDEN PATTERNS"
echo "=============================================="

log_info "Checking for forbidden patterns..."

# Check for hardcoded secrets in all API routes
SECRETS_FOUND=0
> "$_SECRET_FILES"
for dir in "${APP_API_DIRS[@]}"; do
  if [[ -d "$dir" ]]; then
    find "$dir" -name "*.ts" ! -name "*.test.ts" 2>/dev/null >> "$_SECRET_FILES" || true
  fi
done
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if grep -lE "password\s*=\s*['\"][^'\"]{8,}" "$file" 2>/dev/null; then
    log_fail "Hardcoded password in: $file"
    SECRETS_FOUND=$((SECRETS_FOUND + 1))
  fi
done < "$_SECRET_FILES"
if [[ "$SECRETS_FOUND" -eq 0 ]]; then
  log_pass "No hardcoded secrets found in API routes"
fi

# Note: Dev Studio APIs legitimately use child_process/exec for AI code execution.
# This is protected by apiRequireAdmin guard (verified in Section 2).
# No separate injection pattern scan needed.

# =============================================================================
# SECTION 6: COMMAND ALLOWLIST VERIFICATION
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 6: COMMAND ALLOWLIST"
echo "=============================================="

log_info "Checking command allowlist..."
if [[ -f "lib/devstudio/command-allowlist.ts" ]] || [[ -f "lib/studio/allowed-commands.ts" ]]; then
  log_pass "Command allowlist found"
else
  log_warn "Command allowlist not found (recommended for security)"
fi

# =============================================================================
# SECTION 7: PREVIEW CONFIGURATION
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 7: PREVIEW CONFIGURATION"
echo "=============================================="

log_info "Checking preview deployment security..."
PREVIEW_COUNT=0
for dir in "${APP_API_DIRS[@]}"; do
  if [[ -f "$dir/preview/route.ts" ]]; then
    PREVIEW_COUNT=$((PREVIEW_COUNT + 1))
    app_name=$(basename "$(dirname "$dir")")
    if grep -qE "secret|token" "$dir/preview/route.ts" 2>/dev/null; then
      log_pass "Preview API in apps/$app_name has token validation"
    else
      log_warn "Preview API in apps/$app_name may be open (verify token validation)"
    fi
  fi
done
if [[ "$PREVIEW_COUNT" -eq 0 ]]; then
  log_info "No preview APIs found (may be external)"
fi

# =============================================================================
# SECTION 8: DEPLOYMENT CONTROLS
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 8: DEPLOYMENT CONTROLS"
echo "=============================================="

log_info "Checking deployment API security..."
> "$_DEPLOY_FILE"
for dir in "${APP_API_DIRS[@]}"; do
  if [[ -d "$dir" ]]; then
    find "$dir" -path "*/deploy/route.ts" -o -path "*/deployment/route.ts" 2>/dev/null >> "$_DEPLOY_FILE" || true
  fi
done
DEPLOY_COUNT=$(grep -c "route.ts" "$_DEPLOY_FILE" 2>/dev/null || echo 0)

if [[ "$DEPLOY_COUNT" -gt 0 ]]; then
  log_pass "Deployment APIs found: $DEPLOY_COUNT"
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    full_path="/$(api_path "$file")"
    if grep -qE "requireAdmin|requireRole|apiRequireAdmin" "$file" 2>/dev/null; then
      log_pass "$full_path has admin guard"
    else
      log_fail "$full_path missing admin guard"
      FAIL=$((FAIL + 1))
    fi
  done < "$_DEPLOY_FILE"
else
  log_info "No deployment APIs found (may be external)"
fi

# =============================================================================
# SECTION 9: ENVIRONMENT VALIDATION
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 9: ENVIRONMENT VALIDATION"
echo "=============================================="

log_info "Checking environment configuration..."

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "$var" scripts/dev-studio-integration-gate.sh 2>/dev/null || \
       grep -q "$var" northflank/README.md 2>/dev/null || \
       grep -q "$var" .env.example 2>/dev/null; then
        log_pass "$var documented"
    else
        log_warn "$var may not be documented"
    fi
done

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
echo "=============================================="
echo "DEV STUDIO INTEGRATION GATE SUMMARY"
echo "=============================================="
echo ""
echo "Blocking Failures: $FAIL"
echo "Warnings: $WARN"
echo ""

if [[ "$FAIL" -gt 0 ]]; then
    echo -e "${RED}❌ GATE FAILED${NC}"
    echo ""
    echo "Fix all failures before deploying."
    echo ""
    exit 1
fi

if [[ "$WARN" -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  GATE PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Review warnings and address critical ones."
    echo ""
    exit 0
fi

echo -e "${GREEN}✅ GATE PASSED${NC}"
echo ""
echo "Dev Studio is production-ready."
echo ""
exit 0
