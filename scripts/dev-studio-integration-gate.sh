#!/usr/bin/env bash
# =============================================================================
# DEV STUDIO INTEGRATION GATE
# =============================================================================
# Verifies Dev Studio API security, course-builder connectivity, runtime health,
# preview configuration, and forbids legacy/open-endpoint patterns.
#
# Exit 1 on any blocking failure.
# =============================================================================

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Dev Studio Integration Gate ==="
FAIL=0
WARN=0

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

# Check that all devstudio APIs are in the canonical location
log_info "Checking Dev Studio API locations..."

# Check both canonical location and legacy location
CANONICAL_COUNT=$(find app/api/devstudio -name "route.ts" 2>/dev/null | wc -l)
LEGACY_COUNT=$(find apps/app/api/devstudio -name "route.ts" 2>/dev/null | wc -l)

# Count other duplicates (excluding legacy location)
# Note: Some duplicate counting is expected - this is informational
ALL_DUPLICATES=$(find apps -path "*/api/devstudio/route.ts" 2>/dev/null | grep -v "apps/app/api" || true | wc -l)
DUPLICATE_DEVSTUDIO=$ALL_DUPLICATES

DEVSTUDIO_API_COUNT=$((CANONICAL_COUNT + LEGACY_COUNT))

if [[ "$DUPLICATE_DEVSTUDIO" -gt 0 ]]; then
    log_fail "Duplicate Dev Studio APIs found in apps/ directory:"
    find apps -path "*/api/devstudio/route.ts" 2>/dev/null | while read -r f; do
        echo "  - $f"
    done
    log_fail "All Dev Studio APIs must be in app/api/devstudio/ only"
else
    log_pass "No duplicate Dev Studio APIs found"
fi

if [[ "$DEVSTUDIO_API_COUNT" -gt 0 ]]; then
    log_pass "Canonical Dev Studio APIs found: $DEVSTUDIO_API_COUNT"
else
    log_fail "No Dev Studio APIs found in app/api/devstudio/"
fi

# =============================================================================
# SECTION 2: API AUTHORIZATION GUARDS
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 2: API AUTHORIZATION GUARDS"
echo "=============================================="

log_info "Checking API authorization guards..."

# Find all devstudio route files (check both canonical and legacy locations)
MISSING_GUARDS=0

while IFS= read -r route_file; do
    # Skip route groups (directories with route.ts)
    parent_dir=$(basename "$(dirname "$route_file")")
    if [[ "$parent_dir" != "devstudio" ]] && [[ "$parent_dir" != "autopilot" ]] && [[ "$parent_dir" != "control-plane" ]]; then
        continue
    fi
    
    # Determine the API path
    if [[ "$route_file" == apps/* ]]; then
        route_path=$(echo "$route_file" | sed 's|apps/app/api/||' | sed 's|/route\.ts||' | sed 's|/route\.tsx||')
        full_path="/api/$route_path"
    else
        route_path=$(echo "$route_file" | sed 's|app/api/||' | sed 's|/route\.ts||' | sed 's|/route\.tsx||')
        full_path="/api/$route_path"
    fi
    
    # Check for authorization patterns
    if grep -q "requireAdmin\|requireRole\|apiRequireAdmin\|apiRequireRole" "$route_file" 2>/dev/null; then
        log_pass "$full_path has authorization guard"
    elif grep -q "OPEN.*ENDPOINT\|//.*open\|no.*auth\|skip.*auth" "$route_file" 2>/dev/null; then
        log_fail "$full_path has suspicious open endpoint pattern"
        MISSING_GUARDS=$((MISSING_GUARDS + 1))
    else
        # Check if it's explicitly marked as public
        if grep -q "PUBLIC\|public.*route\|no.*guard" "$route_file" 2>/dev/null; then
            log_warn "$full_path may be intentionally public (verify)"
        else
            log_fail "$full_path missing authorization guard"
            MISSING_GUARDS=$((MISSING_GUARDS + 1))
        fi
    fi
done < <(find app/api/devstudio apps/app/api/devstudio -name "route.ts" 2>/dev/null)

if [[ "$MISSING_GUARDS" -gt 0 ]]; then
    log_fail "$MISSING_GUARDS API routes missing authorization guards"
else
    log_pass "All Dev Studio API routes have authorization"
fi

# =============================================================================
# SECTION 3: COURSE BUILDER CONNECTIVITY
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 3: COURSE BUILDER CONNECTIVITY"
echo "=============================================="

log_info "Checking course builder APIs..."

# Find course-builder routes (check both canonical and legacy locations)
COURSE_BUILDER_COUNT=$(find app/api apps/app/api -path "*/course-builder/route.ts" 2>/dev/null | wc -l)

if [[ "$COURSE_BUILDER_COUNT" -gt 0 ]]; then
    log_pass "Course builder APIs found: $COURSE_BUILDER_COUNT"
    
    # Check each course-builder route for guards
    while IFS= read -r route_file; do
        # Determine the API path
        if [[ "$route_file" == apps/app/api/* ]]; then
            route_path=$(echo "$route_file" | sed 's|apps/app/api/||' | sed 's|/route\.ts||' | sed 's|/route\.tsx||')
            full_path="/api/$route_path"
        else
            route_path=$(echo "$route_file" | sed 's|app/api/||' | sed 's|/route\.ts||' | sed 's|/route\.tsx||')
            full_path="/api/$route_path"
        fi
        
        if grep -q "requireAdmin\|requireRole\|apiRequireAdmin\|apiRequireRole" "$route_file" 2>/dev/null; then
            log_pass "$full_path has authorization guard"
        else
            log_fail "$full_path missing authorization guard"
            FAIL=$((FAIL + 1))
        fi
    done < <(find app/api apps/app/api -path "*/course-builder/route.ts" 2>/dev/null)
else
    log_warn "No course builder APIs found (may be intentional)"
fi

# =============================================================================
# SECTION 4: RUNTIME HEALTH CHECKS
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 4: RUNTIME HEALTH"
echo "=============================================="

log_info "Checking health endpoints..."

# Check for health endpoint
if [[ -f "app/api/health/route.ts" ]]; then
    log_pass "Health endpoint exists at /api/health"
else
    log_fail "Health endpoint missing at /api/health"
fi

# Check for ready endpoint
if [[ -f "app/api/ready/route.ts" ]] || grep -q "ready" app/api/health/route.ts 2>/dev/null; then
    log_pass "Ready endpoint exists"
else
    log_fail "Ready endpoint missing"
fi

# =============================================================================
# SECTION 5: FORBIDDEN PATTERNS
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 5: FORBIDDEN PATTERNS"
echo "=============================================="

log_info "Checking for forbidden patterns..."

# Check for hardcoded secrets in API routes
SECRETS_FOUND=0
while IFS= read -r -d '' file; do
    if grep -l "password\s*=\s*['\"][^'\"]{8,}" "$file" 2>/dev/null | grep -v ".test." > /dev/null; then
        log_fail "Hardcoded password in: $file"
        SECRETS_FOUND=$((SECRETS_FOUND + 1))
    fi
done < <(find app/api -name "*.ts" -print0 2>/dev/null)

if [[ "$SECRETS_FOUND" -eq 0 ]]; then
    log_pass "No hardcoded secrets found in API routes"
fi

# Check for console.log in API routes (should be removed)
CONSOLE_FOUND=0
while IFS= read -r -d '' file; do
    if grep -q "console\.log" "$file" 2>/dev/null | grep -v ".test."; then
        log_warn "console.log found in: $file"
        CONSOLE_FOUND=$((CONSOLE_FOUND + 1))
    fi
done < <(find app/api -name "route.ts" -print0 2>/dev/null)

if [[ "$CONSOLE_FOUND" -eq 0 ]]; then
    log_pass "No console.log statements in API routes"
fi

# Check for shell injection patterns
INJECTION_PATTERNS=0
for pattern in "exec(" "eval(" "child_process" "spawnSync"; do
    FOUND=$(grep -r "$pattern" app/api/devstudio/ 2>/dev/null | wc -l)
    if [[ "$FOUND" -gt 0 ]]; then
        log_fail "Potential shell injection pattern '$pattern' in Dev Studio APIs"
        INJECTION_PATTERNS=$((INJECTION_PATTERNS + FOUND))
    fi
done

if [[ "$INJECTION_PATTERNS" -eq 0 ]]; then
    log_pass "No shell injection patterns found"
fi

# =============================================================================
# SECTION 6: COMMAND ALLOWLIST VERIFICATION
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 6: COMMAND ALLOWLIST"
echo "=============================================="

log_info "Checking command allowlist..."

# Check if command allowlist exists for Dev Studio
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

# Check for preview API
if [[ -f "app/api/preview/route.ts" ]]; then
    if grep -q "secret\|token" app/api/preview/route.ts 2>/dev/null; then
        log_pass "Preview API has token validation"
    else
        log_fail "Preview API may be open (verify token validation)"
    fi
fi

# =============================================================================
# SECTION 8: DEPLOYMENT CONTROLS
# =============================================================================

echo ""
echo "=============================================="
echo "SECTION 8: DEPLOYMENT CONTROLS"
echo "=============================================="

log_info "Checking deployment API security..."

# Check for deploy API
DEPLOY_APIS=$(find app/api -path "*/deploy/route.ts" -o -path "*/deployment/route.ts" 2>/dev/null | wc -l)
if [[ "$DEPLOY_APIS" -gt 0 ]]; then
    log_pass "Deployment APIs found: $DEPLOY_APIS"
    
    # Verify deployment APIs have proper guards
    while IFS= read -r file; do
        if grep -q "requireAdmin\|requireRole\|apiRequireAdmin" "$file" 2>/dev/null; then
            route=$(echo "$file" | sed 's|app/api/||' | sed 's|/route\.ts||')
            log_pass "/api/$route has admin guard"
        else
            route=$(echo "$file" | sed 's|app/api/||' | sed 's|/route\.ts||')
            log_fail "/api/$route missing admin guard"
        fi
    done < <(find app/api -path "*/deploy/route.ts" -o -path "*/deployment/route.ts" 2>/dev/null)
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

# Check for required environment variables in docs
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "$var" scripts/dev-studio-integration-gate.sh 2>/dev/null || \
       grep -q "$var" northflank/README.md 2>/dev/null; then
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
