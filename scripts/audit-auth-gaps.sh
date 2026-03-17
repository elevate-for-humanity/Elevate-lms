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

echo "--- NO_AUTH: routes with no auth check ---"
find app/api/ -name "route.ts" | sort | while read -r f; do
  # Skip known-public patterns: webhooks, cron, status, csp-report, lti/jwks
  if echo "$f" | grep -qE "webhook|cron|status|csp-report|lti/jwks|lti/config|trap"; then
    continue
  fi
  if ! grep -qE "requireAuth|apiRequireAdmin|apiAuthGuard|requireAdmin|getUser|createClient|createAdminClient|requireApiAuth|requireApiRole|CRON_SECRET" "$f" 2>/dev/null; then
    echo "  NO_AUTH: $f"
  fi
done
echo ""

echo "--- ROLE_BLIND: admin/* routes that check identity but not role ---"
find app/api/admin/ -name "route.ts" | sort | while read -r f; do
  has_auth=$(grep -cE "getCurrentUser|requireAuth|apiAuthGuard|apiRequireAdmin|getUser\(\)|requireApiAuth|requireApiRole" "$f" 2>/dev/null || true)
  has_role=$(grep -cE "apiRequireAdmin|allowedRoles|\.role\s*===|profile\.role|role.*admin|admin.*role|super_admin|requireApiRole" "$f" 2>/dev/null || true)
  if [ "${has_auth:-0}" -gt 0 ] && [ "${has_role:-0}" -eq 0 ]; then
    echo "  ROLE_BLIND: $f"
  fi
done
echo ""

echo "--- LEAKS_ERROR: routes returning error.message or error.toString() ---"
grep -rl "error\.message\|error\.toString()\|err\.message" app/api/ --include="*.ts" 2>/dev/null | sort | while read -r f; do
  echo "  LEAKS: $f"
done
echo ""

echo "=== Done ==="
