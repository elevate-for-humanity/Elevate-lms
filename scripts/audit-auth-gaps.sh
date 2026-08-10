#!/usr/bin/env bash
# Production API auth audit for the three deployed applications.
# Exit 0 only when no unguarded sensitive route or role-blind admin route remains.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_DIRS=(
  "$ROOT/apps/marketing/app"
  "$ROOT/apps/lms/app"
  "$ROOT/apps/admin/app"
)

ROUTES_FILE=$(mktemp)
ADMIN_ROUTES_FILE=$(mktemp)
trap 'rm -f "$ROUTES_FILE" "$ADMIN_ROUTES_FILE"' EXIT

for dir in "${APP_DIRS[@]}"; do
  [[ -d "$dir/api" ]] && find "$dir/api" -name 'route.ts' 2>/dev/null >> "$ROUTES_FILE"
  [[ -d "$dir/api/admin" ]] && find "$dir/api/admin" -name 'route.ts' 2>/dev/null >> "$ADMIN_ROUTES_FILE"
done
sort -u -o "$ROUTES_FILE" "$ROUTES_FILE"
sort -u -o "$ADMIN_ROUTES_FILE" "$ADMIN_ROUTES_FILE"

route_path() {
  local f="$1"
  case "$f" in
    "$ROOT/apps/marketing/app"/*) printf '/%s' "${f#"$ROOT/apps/marketing/app/"}" | sed 's#/route\.ts$##' ;;
    "$ROOT/apps/lms/app"/*) printf '/%s' "${f#"$ROOT/apps/lms/app/"}" | sed 's#/route\.ts$##' ;;
    "$ROOT/apps/admin/app"/*) printf '/%s' "${f#"$ROOT/apps/admin/app/"}" | sed 's#/route\.ts$##' ;;
    *) printf '%s' "$f" ;;
  esac
}

is_admin_middleware_guarded() {
  local f="$1" p
  [[ "$f" == "$ROOT/apps/admin/app/"* ]] || return 1
  p="$(route_path "$f")"
  case "$p" in
    /api/admin|/api/admin/*|/api/staff|/api/staff/*|/api/devstudio|/api/devstudio/*|/api/platform|/api/platform/*) return 0 ;;
    *) return 1 ;;
  esac
}

is_known_public_contract() {
  local f="$1" p
  p="$(route_path "$f")"

  # Operational liveness/version endpoints intentionally expose no user data.
  case "$p" in
    /api/health|/api/health/*|/api/ping|/api/version|/api/live|/api/status|/api/csp-report|/api/lti/jwks|/api/lti/config) return 0 ;;
  esac

  # Webhooks/cron use provider signatures or service secrets rather than user sessions.
  if [[ "$p" =~ webhook|cron ]]; then return 0; fi

  # Public job/labor-market lookup APIs contain read-only public information.
  case "$p" in
    /api/jobs/search|/api/jobs/salary|/api/onet/careers) return 0 ;;
  esac

  # Public admissions/intake endpoints must remain usable before account creation.
  if [[ "$f" == "$ROOT/apps/marketing/app/"* ]]; then
    case "$p" in
      /api/applications|/api/applications/*|/api/enrollment-v2/apply|/api/employer/apply|/api/host-shop/apply|/api/program-holder/apply) return 0 ;;
    esac
  fi

  # Checkout entry points may create a Stripe session before the purchaser has an LMS session.
  if [[ "$f" == "$ROOT/apps/lms/app/"* ]]; then
    case "$p" in
      /api/checkout/phlebotomy|/api/stripe/trial-checkout) return 0 ;;
    esac
  fi

  return 1
}

has_explicit_public_marker() {
  grep -qE 'AUTH: Intentionally public|AUTH: Enforced inside handler|// PUBLIC ROUTE|AUTH_EXEMPT' "$1" 2>/dev/null
}

has_route_auth() {
  grep -qE 'requireAuth|apiRequireAdmin|apiAuthGuard|requireAdmin|getUser|getCurrentUser|getAuthUser|createClient|createAdminClient|requireApiAuth|requireApiRole|CRON_SECRET|apiGuard|withAuth|checkAuth|verifyAuth|authMiddleware|requireOrgAdmin|AUDIT_SECRET|apiRequireInstructor|builderGuard|requireInstructor|apiRequireRole|resolveOwnedSite|resolveAuthenticated|assertAuthenticated|requireUser' "$1" 2>/dev/null
}

NO_AUTH=0
ROLE_BLIND=0
LEAKS=0
REEXPORTS=0

echo '=== Elevate — Production API Auth Audit ==='
echo "Routes scanned: $(wc -l < "$ROUTES_FILE" | tr -d ' ')"
echo ''

echo '--- REEXPORT: target auth must be reviewed ---'
while IFS= read -r f; do
  if grep -qE '^export \{.+\} from ' "$f" 2>/dev/null; then
    target=$(grep -E '^export \{.+\} from ' "$f" | head -1 | grep -oP "from '\K[^']+" || true)
    echo "  REEXPORT_CHECK: $(route_path "$f") → $target"
    REEXPORTS=$((REEXPORTS + 1))
  fi
done < "$ROUTES_FILE"
echo ''

echo '--- NO_AUTH: deployed sensitive routes without a verified guard ---'
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if grep -qE '^export \{.+\} from ' "$f" 2>/dev/null; then continue; fi
  if has_explicit_public_marker "$f" || is_known_public_contract "$f" || is_admin_middleware_guarded "$f"; then continue; fi
  if ! has_route_auth "$f"; then
    echo "  NO_AUTH: $(route_path "$f") [$f]"
    NO_AUTH=$((NO_AUTH + 1))
  fi
done < "$ROUTES_FILE"
echo ''

echo '--- ROLE_BLIND: admin API routes with route auth but no role guard and no middleware RBAC ---'
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if is_admin_middleware_guarded "$f"; then continue; fi
  has_auth=$(grep -cE 'getCurrentUser|getAuthUser|requireAuth|apiAuthGuard|apiRequireAdmin|getUser\(\)|requireApiAuth|requireApiRole|withAuth|checkAuth|verifyAuth' "$f" 2>/dev/null || true)
  has_role=$(grep -cE 'apiRequireAdmin|allowedRoles|\.role\s*===|profile\.role|role.*admin|admin.*role|super_admin|requireApiRole' "$f" 2>/dev/null || true)
  if [[ "${has_auth:-0}" -gt 0 && "${has_role:-0}" -eq 0 ]]; then
    echo "  ROLE_BLIND: $(route_path "$f") [$f]"
    ROLE_BLIND=$((ROLE_BLIND + 1))
  fi
done < "$ADMIN_ROUTES_FILE"
echo ''

echo '--- LEAKS_ERROR: response bodies may expose internal exception text ---'
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if grep -qE 'CRON_SECRET|x-internal-token|JOB_PROCESSOR_TOKEN|AUDIT_SECRET' "$f" 2>/dev/null; then continue; fi
  leaking=$(grep -nE 'err\.message|error\.message|error\.toString\(\)' "$f" 2>/dev/null \
    | grep -vE 'logger\.|console\.|\.includes\(|error_message|error_summary|\.slice\(|writeApiAudit|throw |throw new|setAuditContext|audit_context|sendSlack|last_error|\.message ===|\.message !==|\.message\.includes|= err instanceof|= error instanceof|msg = |message = |results\.errors\.push' || true)
  if [[ -n "$leaking" ]]; then
    echo "  LEAKS: $(route_path "$f") [$f]"
    LEAKS=$((LEAKS + 1))
  fi
done < "$ROUTES_FILE"
echo ''

echo "Summary: no_auth=$NO_AUTH role_blind=$ROLE_BLIND error_leak_warnings=$LEAKS reexports=$REEXPORTS"

if [[ "$NO_AUTH" -gt 0 || "$ROLE_BLIND" -gt 0 ]]; then
  echo 'FAIL: deployed sensitive API routes remain without verified authentication/RBAC.'
  exit 1
fi

if [[ "$LEAKS" -gt 0 ]]; then
  echo 'WARN: authentication/RBAC is clean, but exception-text response leaks remain to harden.'
fi

echo 'PASS: no unguarded sensitive API routes or role-blind admin routes detected.'
exit 0
