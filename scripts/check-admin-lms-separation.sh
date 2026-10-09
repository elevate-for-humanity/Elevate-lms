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

# Use portable grep checks on GitHub runner images without ripgrep.

# 1) The separate Google container images must serve their own applications.
LMS_DOCKERFILE="Dockerfile.northflank-lms"
ADMIN_DOCKERFILE="Dockerfile.northflank-admin"
for file in "$LMS_DOCKERFILE" "$ADMIN_DOCKERFILE"; do
  [[ -f "$file" ]] || fail "$file missing"
  grep -q '/api/ping' "$file" || fail "$file must healthcheck /api/ping"
done
grep -q 'apps/admin/server\.js' "$ADMIN_DOCKERFILE" || fail "Admin image must serve Admin"
grep -q 'apps/lms/server\.js' "$LMS_DOCKERFILE" || fail "LMS image must serve LMS"
pass "Google Admin and LMS container applications remain separate"

# 2) Require the actual Google deployment path, not retired source workflows.
ADMIN_WF=".github/workflows/deploy-admin.yml"
IMAGE_WF=".github/workflows/build-google-migration-images.yml"
STAGE_WF=".github/workflows/stage-google-web.yml"
STAGE_SCRIPT="scripts/gcp/stage-web.mjs"
for file in "$ADMIN_WF" "$IMAGE_WF" "$STAGE_WF" "$STAGE_SCRIPT"; do
  [[ -f "$file" ]] || fail "$file missing"
done
grep -q 'gcloud run services update elevate-admin-migration' "$ADMIN_WF" || fail "Admin deployment must target its Google service"
grep -q 'Dockerfile.northflank-admin' "$ADMIN_WF" || fail "Admin deployment must build its own image"
grep -q 'lms\) FILE=Dockerfile.northflank-lms' "$IMAGE_WF" || fail "Google LMS build must use its own image"
grep -q 'loadGoogleConfig\(component\)' "$STAGE_SCRIPT" || fail "Staging must load component-scoped Google configuration"
grep -Fq 'elevate-${component}-migration' "$STAGE_SCRIPT" || fail "Staging must use a component-scoped Google service"
grep -q 'stage-web\.mjs' "$STAGE_WF" || fail "Google staging workflow must use the reviewed staging implementation"
if grep -q 'NORTHFLANK_API_TOKEN|configure-services\.ts|api\.northflank\.com' "$ADMIN_WF" "$IMAGE_WF" "$STAGE_WF" "$STAGE_SCRIPT"; then
  fail "Active Google deployment must not depend on a retired source control plane"
fi
pass "Google deployment keeps Admin and LMS images, services and configuration separate"

# 3) Keep one canonical admin dashboard implementation.
# The Admin app is mounted on the admin origin, so its canonical dashboard URL
# is /dashboard. Do not force a second /admin/dashboard namespace into the app.
ADMIN_DASHBOARD="apps/admin/app/dashboard/page.tsx"
ADMIN_DASH_ENH="apps/admin/app/admin/dashboard-enhanced/page.tsx"
ADMIN_LMS_DASH="apps/admin/app/admin/lms-dashboard/page.tsx"

[[ -f "$ADMIN_DASHBOARD" ]] || fail "$ADMIN_DASHBOARD missing; /dashboard is the canonical Admin dashboard"
for f in "$ADMIN_DASH_ENH" "$ADMIN_LMS_DASH"; do
  [[ ! -f "$f" ]] || fail "$f should be removed after feature parity; use /dashboard"
done
pass "Admin dashboard implementation is canonical at /dashboard"

# 4) Legacy admin applicants nav entry should not exist.
if grep -q "href: '/admin/applicants'" components/admin/AdminNav.tsx; then
  fail "AdminNav contains legacy /admin/applicants link"
fi
pass "Admin nav does not include legacy applicants path"

# 5) Legacy app-detail links should use canonical review route.
if [[ -d apps/admin/app/admin ]]; then
  grep -RnF --include='*.tsx' '/admin/applications/${' apps/admin/app/admin >/tmp/legacy_app_links_raw.txt || true
else
  : >/tmp/legacy_app_links_raw.txt
fi
grep -v '/admin/applications/review/' /tmp/legacy_app_links_raw.txt | grep -v '/api/admin/applications/' >/tmp/legacy_app_links.txt || true
if [[ -s /tmp/legacy_app_links.txt ]]; then
  echo "Legacy links found:"
  cat /tmp/legacy_app_links.txt
  fail "Use /admin/applications/review/{id} for admin application detail links"
fi
pass "Admin application detail links use canonical review route"

echo "All admin/LMS separation checks passed."
