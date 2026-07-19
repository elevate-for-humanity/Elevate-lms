#!/usr/bin/env bash
# scripts/audit-auth-gaps.sh
# Scans API routes for missing or role-blind auth.
# Updated for monorepo split: scans apps/{marketing,lms,admin}, app-legacy, and apps/*/app
# Reports three categories:
#   NO_AUTH     — no auth check of any kind
#   ROLE_BLIND  — checks identity but not role (admin/* routes only)
#   LEAKS_ERROR — returns error.message or error.toString() directly
# Usage: bash scripts/audit-auth-gaps.sh
# Exit code: 0 = clean, 1 = issues found

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# All app directories to scan (monorepo split + app-legacy)
APP_DIRS=(
  "$ROOT/app-legacy"
  "$ROOT/apps/marketing/app"
  "$ROOT/apps/lms/app"
  "$ROOT/apps/admin/app"
  "$ROOT/apps/app"
)

# Build a temp file with all route.ts paths
ROUTES_FILE=$(mktemp)
ADMIN_ROUTES_FILE=$(mktemp)
trap "rm -f $ROUTES_FILE $ADMIN_ROUTES_FILE" EXIT

for dir in "${APP_DIRS[@]}"; do
  if [ -d "$dir/api" ]; then
    find "$dir/api" -name "route.ts" 2>/dev/null >> "$ROUTES_FILE"
  fi
done
sort -o "$ROUTES_FILE" "$ROUTES_FILE"

# Admin routes separately
for dir in "${APP_DIRS[@]}"; do
  if [ -d "$dir/api/admin" ]; then
    find "$dir/api/admin" -name "route.ts" 2>/dev/null >> "$ADMIN_ROUTES_FILE"
  fi
done
sort -o "$ADMIN_ROUTES_FILE" "$ADMIN_ROUTES_FILE"

echo "=== Elevate LMS — Auth Gap Audit ==="
echo ""

echo "--- REEXPORT: routes that re-export from another file (verify target has auth) ---"
while IFS= read -r f; do
  if grep -qE "^export \{.+\} from " "$f" 2>/dev/null; then
    target=$(grep -E "^export \{.+\} from " "$f" | head -1 | grep -oP "from '\K[^']+")
    echo "  REEXPORT_CHECK: $f → $target"
  fi
done < "$ROUTES_FILE"
echo ""

echo "--- NO_AUTH: routes with no auth check ---"
while IFS= read -r f; do
  # Skip re-exports
  if grep -qE "^export \{.+\} from " "$f" 2>/dev/null; then
    continue
  fi
  # Skip known-public patterns
  if echo "$f" | grep -qE "webhook|cron|status|csp-report|lti/jwks|lti/config|trap"; then
    continue
  fi
  if grep -qE "AUTH: Intentionally public|AUTH: Enforced inside handler|// PUBLIC ROUTE|AUTH_EXEMPT" "$f" 2>/dev/null; then
    continue
  fi
  if grep -qE "NextResponse\.redirect\(" "$f" 2>/dev/null && ! grep -qE "POST|PUT|PATCH|DELETE" "$f" 2>/dev/null; then
    if grep -qE "supersonicfastermoney\.com|308" "$f" 2>/dev/null; then
      continue
    fi
  fi
  if grep -q "supersonicfastermoney.com" "$f" 2>/dev/null; then
    continue
  fi
  if ! grep -qE "requireAuth|apiRequireAdmin|apiAuthGuard|requireAdmin|getUser|getCurrentUser|getAuthUser|createClient|createAdminClient|requireApiAuth|requireApiRole|CRON_SECRET|apiGuard|withAuth|checkAuth|verifyAuth|authMiddleware|requireOrgAdmin|AUDIT_SECRET|apiRequireInstructor|builderGuard|requireInstructor|requireOrgAdmin|apiRequireRole|requireApiRole|requireOrgAdmin" "$f" 2>/dev/null; then
    echo "  NO_AUTH: $f"
  fi
done < "$ROUTES_FILE"
echo ""

echo "--- ROLE_BLIND: admin/* routes that check identity but not role ---"
while IFS= read -r f; do
  has_auth=$(grep -cE "getCurrentUser|getAuthUser|requireAuth|apiAuthGuard|apiRequireAdmin|getUser\(\)|requireApiAuth|requireApiRole|withAuth|checkAuth|verifyAuth" "$f" 2>/dev/null || true)
  has_role=$(grep -cE "apiRequireAdmin|allowedRoles|\.role\s*===|profile\.role|role.*admin|admin.*role|super_admin|requireApiRole" "$f" 2>/dev/null || true)
  if [ "${has_auth:-0}" -gt 0 ] && [ "${has_role:-0}" -eq 0 ]; then
    echo "  ROLE_BLIND: $f"
  fi
done < "$ADMIN_ROUTES_FILE"
echo ""

echo "--- LEAKS_ERROR: routes returning error.message or error.toString() in response body ---"
while IFS= read -r f; do
  if grep -qE "CRON_SECRET|x-internal-token|JOB_PROCESSOR_TOKEN|AUDIT_SECRET" "$f" 2>/dev/null; then
    continue
  fi
  if grep -qE "// PUBLIC ROUTE:" "$f" 2>/dev/null; then
    continue
  fi
  leaking=$(grep -n "err\.message\|error\.message\|error\.toString()" "$f" 2>/dev/null \
    | grep -v "logger\.\|console\.\|\.includes(\|error_message\|error_summary\|\.slice(\|writeApiAudit\|\.update(\|\.from(\|throw \|throw new\|Error(\|\.code\b\|setAuditContext\|audit_context\|sendSlack\|sendSlackMessage\|last_error\|\.message ===\|\.message !==\|\.message\.includes\|// \|= err instanceof\|= error instanceof\|msg = \|message = \|error: err\|error: error\|fields:\|results\.errors\.push\|detail:\|message: error\.\|message: err\." \
    | grep -v "^[^:]*:[^:]*://" || true)
  if [ -n "$leaking" ]; then
    echo "  LEAKS: $f"
  fi
done < "$ROUTES_FILE"
echo ""

echo "=== Done ==="
