#!/usr/bin/env bash
# Scans API routes for missing or role-blind auth.
# Default mode reports all findings. --strict fails on production-sensitive findings.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
STRICT=0
[[ "${1:-}" == "--strict" ]] && STRICT=1

APP_DIRS=(
  "$ROOT/app-legacy"
  "$ROOT/apps/marketing/app"
  "$ROOT/apps/lms/app"
  "$ROOT/apps/admin/app"
  "$ROOT/apps/app"
)

ROUTES_FILE=$(mktemp)
ADMIN_ROUTES_FILE=$(mktemp)
trap 'rm -f "$ROUTES_FILE" "$ADMIN_ROUTES_FILE"' EXIT

for dir in "${APP_DIRS[@]}"; do
  [[ -d "$dir/api" ]] && find "$dir/api" -name "route.ts" 2>/dev/null >> "$ROUTES_FILE"
  [[ -d "$dir/api/admin" ]] && find "$dir/api/admin" -name "route.ts" 2>/dev/null >> "$ADMIN_ROUTES_FILE"
done
sort -u -o "$ROUTES_FILE" "$ROUTES_FILE"
sort -u -o "$ADMIN_ROUTES_FILE" "$ADMIN_ROUTES_FILE"

NO_AUTH=0
SENSITIVE_NO_AUTH=0
ROLE_BLIND=0
LEAKS=0
SENSITIVE_LEAKS=0

is_sensitive_route() {
  local f="$1"
  echo "$f" | grep -qE '/api/admin/|/api/devstudio/|/api/platform/workspaces/provision/|/api/program-holder/applications/.+/(approve|deny)/|/api/admin/sendgrid/'
}

echo "=== Elevate LMS — Auth Gap Audit ==="
echo ""
echo "--- REEXPORT: routes that re-export from another file (verify target has auth) ---"
while IFS= read -r f; do
  if grep -qE "^export \{.+\} from " "$f" 2>/dev/null; then
    target=$(grep -E "^export \{.+\} from " "$f" | head -1 | grep -oP "from '\K[^']+" || true)
    echo "  REEXPORT_CHECK: $f → $target"
  fi
done < "$ROUTES_FILE"

echo ""
echo "--- NO_AUTH: routes with no auth check ---"
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  grep -qE "^export \{.+\} from " "$f" 2>/dev/null && continue
  echo "$f" | grep -qE "webhook|cron|status|csp-report|lti/jwks|lti/config|trap" && continue
  grep -qE "AUTH: Intentionally public|AUTH: Enforced inside handler|// PUBLIC ROUTE|AUTH_EXEMPT" "$f" 2>/dev/null && continue
  if grep -qE "NextResponse\.redirect\(" "$f" 2>/dev/null && ! grep -qE "POST|PUT|PATCH|DELETE" "$f" 2>/dev/null; then
    grep -qE "supersonicfastermoney\.com|308" "$f" 2>/dev/null && continue
  fi
  grep -q "supersonicfastermoney.com" "$f" 2>/dev/null && continue

  if ! grep -qE "requireAuth|apiRequireAdmin|apiAuthGuard|requireAdmin|getUser|getCurrentUser|getAuthUser|createClient|createAdminClient|requireApiAuth|requireApiRole|CRON_SECRET|apiGuard|withAuth|checkAuth|verifyAuth|authMiddleware|requireOrgAdmin|AUDIT_SECRET|apiRequireInstructor|builderGuard|requireInstructor|apiRequireRole" "$f" 2>/dev/null; then
    NO_AUTH=$((NO_AUTH + 1))
    if is_sensitive_route "$f"; then
      SENSITIVE_NO_AUTH=$((SENSITIVE_NO_AUTH + 1))
      echo "  NO_AUTH [BLOCKING]: $f"
    else
      echo "  NO_AUTH [REVIEW]: $f"
    fi
  fi
done < "$ROUTES_FILE"

echo ""
echo "--- ROLE_BLIND: admin/* routes that check identity but not role ---"
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  has_auth=$(grep -cE "getCurrentUser|getAuthUser|requireAuth|apiAuthGuard|apiRequireAdmin|getUser\(\)|requireApiAuth|requireApiRole|withAuth|checkAuth|verifyAuth" "$f" 2>/dev/null || true)
  has_role=$(grep -cE "apiRequireAdmin|allowedRoles|\.role\s*===|profile\.role|role.*admin|admin.*role|super_admin|requireApiRole|API_ADMIN_ROLES|roles:\s*\[|roles:\s*[A-Z_]+" "$f" 2>/dev/null || true)
  if [[ "${has_auth:-0}" -gt 0 && "${has_role:-0}" -eq 0 ]]; then
    ROLE_BLIND=$((ROLE_BLIND + 1))
    echo "  ROLE_BLIND [BLOCKING]: $f"
  fi
done < "$ADMIN_ROUTES_FILE"

echo ""
echo "--- LEAKS_ERROR: routes returning internal error details ---"
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  grep -qE "CRON_SECRET|x-internal-token|JOB_PROCESSOR_TOKEN|AUDIT_SECRET" "$f" 2>/dev/null && continue
  grep -qE "// PUBLIC ROUTE:" "$f" 2>/dev/null && continue
  leaking=$(grep -n "err\.message\|error\.message\|error\.toString()" "$f" 2>/dev/null \
    | grep -v "logger\.\|console\.\|\.includes(\|error_message\|error_summary\|\.slice(\|writeApiAudit\|\.update(\|\.from(\|throw \|throw new\|Error(\|\.code\b\|setAuditContext\|audit_context\|sendSlack\|sendSlackMessage\|last_error\|\.message ===\|\.message !==\|\.message\.includes\|// \|= err instanceof\|= error instanceof\|msg = \|message = \|error: err\|error: error\|fields:\|results\.errors\.push\|detail:\|message: error\.\|message: err\." \
    | grep -v "^[^:]*:[^:]*://" || true)
  if [[ -n "$leaking" ]]; then
    LEAKS=$((LEAKS + 1))
    if is_sensitive_route "$f"; then
      SENSITIVE_LEAKS=$((SENSITIVE_LEAKS + 1))
      echo "  LEAKS [BLOCKING]: $f"
    else
      echo "  LEAKS [REVIEW]: $f"
    fi
  fi
done < "$ROUTES_FILE"

echo ""
echo "Summary: NO_AUTH=$NO_AUTH (blocking=$SENSITIVE_NO_AUTH), ROLE_BLIND=$ROLE_BLIND, LEAKS=$LEAKS (blocking=$SENSITIVE_LEAKS)"

BLOCKING=$((SENSITIVE_NO_AUTH + ROLE_BLIND + SENSITIVE_LEAKS))
if [[ "$STRICT" -eq 1 && "$BLOCKING" -gt 0 ]]; then
  echo "FAIL: $BLOCKING production-sensitive auth/security finding(s)."
  exit 1
fi

echo "PASS: auth audit completed${STRICT:+ in strict mode}."
exit 0
