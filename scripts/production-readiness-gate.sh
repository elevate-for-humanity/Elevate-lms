#!/usr/bin/env bash
# Production activation gate — run before promote/deploy.
# Exit 1 on any blocking failure.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# PRODUCTION BUILD CONFIGURATION (Next.js 15 + React 19 Optimized)
export NODE_OPTIONS='--max-old-space-size=12288'
export DISABLE_WEBPACK_FILESYSTEM_CACHE=
export BUILD_SCOPE=1

echo "=== Production Readiness Gate ==="
FAIL=0

run() {
  local name="$1"
  shift
  echo ""
  echo "--- $name ---"
  if "$@"; then
    echo "OK: $name"
  else
    echo "FAIL: $name"
    FAIL=1
  fi
}

run "API admin guards" bash scripts/audit-api-auth-guards.sh
run "Auth gaps" bash scripts/audit-auth-gaps.sh
run "Env vars" bash scripts/audit-env-vars.sh
run "Redirect conflicts" env BUILD_SCOPE=1 node scripts/check-redirect-conflicts.mjs
run "Public route guards" node scripts/guard-public-routes.mjs
run "Pre-auth registry" node scripts/check-pre-auth-registry.cjs

if [[ -f scripts/audit-public-html.mjs ]]; then
  run "Public HTML hygiene" node scripts/audit-public-html.mjs || true
fi

echo ""
if [[ "$FAIL" -ne 0 ]]; then
  echo "=== GATE FAILED — resolve blockers before production activation ==="
  exit 1
fi
echo "=== GATE PASSED (runtime smoke: curl /api/health and /api/ready after deploy) ==="
exit 0
