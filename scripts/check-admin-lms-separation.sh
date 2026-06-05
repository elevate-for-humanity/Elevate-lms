#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 1) Northflank Dockerfiles and service config must keep service roles separated.
LMS_DOCKERFILE="Dockerfile.northflank-lms"
ADMIN_DOCKERFILE="Dockerfile.northflank-admin"
NF_CONFIG="scripts/northflank/configure-services.ts"
[[ -f "$LMS_DOCKERFILE" ]] || fail "$LMS_DOCKERFILE missing"
[[ -f "$ADMIN_DOCKERFILE" ]] || fail "$ADMIN_DOCKERFILE missing"
[[ -f "$NF_CONFIG" ]] || fail "$NF_CONFIG missing"

grep -q "SERVICE_ROLE: 'lms'" "$NF_CONFIG" || fail "Northflank config must set SERVICE_ROLE=lms"
grep -q "SERVICE_ROLE: 'admin'" "$NF_CONFIG" || fail "Northflank config must set SERVICE_ROLE=admin"
grep -q '/api/ping' "$LMS_DOCKERFILE" || fail "LMS Dockerfile must healthcheck /api/ping"
grep -q '/api/ping' "$ADMIN_DOCKERFILE" || fail "Admin Dockerfile must healthcheck /api/ping"
pass "Northflank Dockerfile and service config separation looks correct"

# 2) Deployment workflows must stay separated.
ADMIN_WF=".github/workflows/deploy-admin.yml"
LMS_WF=".github/workflows/deploy-lms.yml"
[[ -f "$ADMIN_WF" ]] || fail "$ADMIN_WF missing"
[[ -f "$LMS_WF" ]] || fail "$LMS_WF missing"

grep -q 'elevate-admin' "$ADMIN_WF" || fail "deploy-admin must target elevate-admin"
grep -q 'elevate-lms' "$LMS_WF" || fail "deploy-lms must target elevate-lms"
grep -q 'Dockerfile.northflank-admin' "$ADMIN_WF" || fail "deploy-admin must reference admin Dockerfile"
grep -q 'Dockerfile.northflank-lms' "$LMS_WF" || fail "deploy-lms must reference LMS Dockerfile"
if grep -q 'Dockerfile.northflank-admin' "$LMS_WF"; then
  fail "deploy-lms should not reference admin Dockerfile"
fi
if grep -q 'configure-services.ts --execute' "$ADMIN_WF" && ! grep -q 'NORTHFLANK_ADMIN_SERVICE_ID" --execute' "$ADMIN_WF"; then
  fail "deploy-admin must scope configure-services to admin only"
fi
if grep -q 'configure-services.ts --execute' "$LMS_WF" && ! grep -q 'NORTHFLANK_LMS_SERVICE_ID" --execute' "$LMS_WF"; then
  fail "deploy-lms must scope configure-services to LMS only"
fi
if grep -q 'verify-health-checks.ts"$' "$ADMIN_WF" || grep -q 'verify-health-checks.ts$' "$ADMIN_WF"; then
  fail "deploy-admin must pass service id to verify-health-checks"
fi
if grep -q 'verify-health-checks.ts"$' "$LMS_WF" || grep -q 'verify-health-checks.ts$' "$LMS_WF"; then
  fail "deploy-lms must pass service id to verify-health-checks"
fi
pass "Northflank deploy workflow split looks correct"

# 3) Keep one canonical admin dashboard entry.
ADMIN_LANDING="apps/admin/app/admin/page.tsx"
ADMIN_DASH_ENH="apps/admin/app/admin/dashboard-enhanced/page.tsx"
ADMIN_LMS_DASH="apps/admin/app/admin/lms-dashboard/page.tsx"

[[ -f "$ADMIN_LANDING" ]] || fail "$ADMIN_LANDING missing"
grep -q "redirect('/admin/dashboard')" "$ADMIN_LANDING" || fail "$ADMIN_LANDING must redirect to /admin/dashboard"
for f in "$ADMIN_DASH_ENH" "$ADMIN_LMS_DASH"; do
  [[ ! -f "$f" ]] || fail "$f should be removed; use /admin/dashboard directly"
done
pass "Admin dashboard route tree is consolidated"

# 4) Legacy admin applicants nav entry should not exist.
if grep -q "href: '/admin/applicants'" components/admin/AdminNav.tsx; then
  fail "AdminNav contains legacy /admin/applicants link"
fi
pass "Admin nav does not include legacy applicants path"

# 5) Legacy app-detail links should use canonical review route.
grep -R --line-number --include='*.tsx' '/admin/applications/${' apps/admin/app/admin >/tmp/legacy_app_links_raw.txt || true
grep -v '/admin/applications/review/' /tmp/legacy_app_links_raw.txt | grep -v '/api/admin/applications/' >/tmp/legacy_app_links.txt || true
if [[ -s /tmp/legacy_app_links.txt ]]; then
  echo "Legacy links found:"
  cat /tmp/legacy_app_links.txt
  fail "Use /admin/applications/review/{id} for admin application detail links"
fi
pass "Admin application detail links use canonical review route"

echo "All admin/LMS separation checks passed."
