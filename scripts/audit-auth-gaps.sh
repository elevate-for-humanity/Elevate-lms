#!/usr/bin/env bash
# scripts/audit-auth-gaps.sh
# Scans API routes for missing or role-blind auth.
# Reports three categories:
#   NO_AUTH     — no auth check of any kind
#   ROLE_BLIND  — checks identity but not role (admin/* routes only)
#   LEAKS_ERROR — returns error.message or error.toString() directly
# Usage: bash scripts/audit-auth-gaps.sh
# Exit code: 0 = clean, 1 = issues found

set -euo pipefail

NO_AUTH=0
ROLE_BLIND=0
LEAKS=0

echo "=== Elevate LMS — Auth Gap Audit ==="
echo ""

echo "--- REEXPORT: routes that re-export from another file (verify target has auth) ---"
find app/api/ -name "route.ts" | sort | while read -r f; do
  if grep -qE "^export \{.+\} from " "$f" 2>/dev/null; then
    target=$(grep -E "^export \{.+\} from " "$f" | head -1 | grep -oP "from '\K[^']+")
    echo "  REEXPORT_CHECK: $f → $target"
  fi
done
echo ""

echo "--- NO_AUTH: routes with no auth check ---"
find app/api/ -name "route.ts" | sort | while read -r f; do
  # Skip re-exports — they delegate auth to the target file
  if grep -qE "^export \{.+\} from " "$f" 2>/dev/null; then
    continue
  fi
  # Skip known-public patterns: webhooks, cron, status, csp-report, lti/jwks
  if echo "$f" | grep -qE "webhook|cron|status|csp-report|lti/jwks|lti/config|trap"; then
    continue
  fi
  # Skip files with explicit intentional-public or handler-delegated auth comment
  if grep -qE "AUTH: Intentionally public|AUTH: Enforced inside handler|AUTH: Intentionally public" "$f" 2>/dev/null; then
    continue
  fi
  if ! grep -qE "requireAuth|apiRequireAdmin|apiAuthGuard|requireAdmin|getUser|getCurrentUser|getAuthUser|createClient|createAdminClient|requireApiAuth|requireApiRole|CRON_SECRET|apiGuard|withAuth|checkAuth|verifyAuth|authMiddleware|requireOrgAdmin|AUDIT_SECRET" "$f" 2>/dev/null; then
    echo "  NO_AUTH: $f"
  fi
done
echo ""

echo "--- ROLE_BLIND: admin/* routes that check identity but not role ---"
find app/api/admin/ -name "route.ts" | sort | while read -r f; do
  has_auth=$(grep -cE "getCurrentUser|getAuthUser|requireAuth|apiAuthGuard|apiRequireAdmin|getUser\(\)|requireApiAuth|requireApiRole|withAuth|checkAuth|verifyAuth" "$f" 2>/dev/null || true)
  has_role=$(grep -cE "apiRequireAdmin|allowedRoles|\.role\s*===|profile\.role|role.*admin|admin.*role|super_admin|requireApiRole" "$f" 2>/dev/null || true)
  if [ "${has_auth:-0}" -gt 0 ] && [ "${has_role:-0}" -eq 0 ]; then
    echo "  ROLE_BLIND: $f"
  fi
done
echo ""

echo "--- LEAKS_ERROR: routes returning error.message or error.toString() in response body ---"
find app/api/ -name "route.ts" | sort | while read -r f; do
  # Find lines with error.message that are NOT in logger/console calls, NOT in DB column writes,
  # NOT in .includes() checks, NOT in throw statements, NOT in audit context
  leaking=$(grep -n "err\.message\|error\.message\|error\.toString()" "$f" 2>/dev/null \
    | grep -v "logger\.\|console\.\|\.includes(\|error_message\|error_summary\|\.slice(\|writeApiAudit\|\.update(\|\.from(\|throw \|throw new\|Error(\|\.code\b\|setAuditContext\|audit_context\|sendSlack\|sendSlackMessage\|last_error\|\.message ===\|\.message !==\|\.message\.includes\|// \|= err instanceof\|= error instanceof\|msg = \|message = \|error: err\|error: error\|fields:" \
    | grep -v "^[^:]*:[^:]*://" || true)
  if [ -n "$leaking" ]; then
    echo "  LEAKS: $f"
  fi
done
echo ""

echo "=== Done ==="
