#!/usr/bin/env bash
# Verify both layers of the Admin API authorization architecture:
#   1. every /api/admin route is covered by authenticated, role-aware middleware;
#   2. especially sensitive mutation routes also enforce a route-local guard.

set -euo pipefail

ADMIN_ROOT="apps/admin/app/api/admin"
MIDDLEWARE="apps/admin/middleware.ts"

if [[ ! -d "$ADMIN_ROOT" || ! -f "$MIDDLEWARE" ]]; then
  echo "❌ Admin API root or middleware not found"
  exit 1
fi

route_count="$(find "$ADMIN_ROOT" -name 'route.ts' | wc -l | tr -d ' ')"
if [[ "$route_count" -eq 0 ]]; then
  echo "❌ Admin route guard scanned zero routes"
  exit 1
fi

for contract in \
  "matcher:" \
  "supabase.auth.getUser()" \
  "hasAnyRole(effectiveRoles, requiredRoles(pathname)" \
  "return ADMIN_ROLES"; do
  if ! grep -Fq "$contract" "$MIDDLEWARE"; then
    echo "❌ Admin middleware authorization contract missing: $contract"
    exit 1
  fi
done

# These operations can change credentials, identities, roles, or active
# sessions. Middleware remains the first boundary; a canonical local guard is
# mandatory as defense in depth.
CRITICAL_ROUTES=(
  "$ADMIN_ROOT/platform-secrets/route.ts"
  "$ADMIN_ROOT/impersonate/route.ts"
  "$ADMIN_ROOT/users/role/route.ts"
  "$ADMIN_ROOT/users/update-role/route.ts"
  "$ADMIN_ROOT/users/update-status/route.ts"
  "$ADMIN_ROOT/revoke-all-sessions/route.ts"
)

FAILED=0
for file in "${CRITICAL_ROUTES[@]}"; do
  if [[ ! -f "$file" ]] || ! grep -Eq "apiRequireRoles\(|apiRequireAdmin\(" "$file"; then
    echo "❌ Critical Admin route missing a canonical local role guard: $file"
    FAILED=1
  fi
done

if [[ "$FAILED" -ne 0 ]]; then
  exit 1
fi

echo "✅ $route_count Admin routes are covered by role-aware middleware"
echo "✅ ${#CRITICAL_ROUTES[@]} privileged mutation routes have route-local guards"
