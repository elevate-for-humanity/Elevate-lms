#!/usr/bin/env bash
# Audits next.config.mjs and netlify.toml for known config issues.
# Exits 0 if all checks pass, 1 if any fail.

set -euo pipefail
PASS=0
FAIL=1
result=0

check() {
  local label="$1"
  local status="$2"  # "pass" or "fail"
  local detail="${3:-}"
  if [ "$status" = "pass" ]; then
    echo "✅ PASS: $label"
  else
    echo "❌ FAIL: $label${detail:+ — $detail}"
    result=1
  fi
}

# ── Check 1: eslint config key removed from next.config.mjs ──────────────────
# Matches only a top-level config key like `eslint: {`, not string occurrences
# inside serverExternalPackages or outputFileTracingExcludes arrays.
if grep -qE '^\s+eslint\s*:\s*\{' next.config.mjs; then
  check "No eslint config key in next.config.mjs" "fail" \
    "$(grep -nE '^\s+eslint\s*:\s*\{' next.config.mjs)"
else
  check "No eslint config key in next.config.mjs" "pass"
fi

# ── Check 2: no consecutive blank lines in next.config.mjs ───────────────────
# Uses prev-line tracking — no exit-code inversion bug.
doubles=$(awk 'prev=="" && /^[[:space:]]*$/{print "line " NR} {prev=$0}' next.config.mjs)
if [ -n "$doubles" ]; then
  check "No consecutive blank lines in next.config.mjs" "fail" "$doubles"
else
  check "No consecutive blank lines in next.config.mjs" "pass"
fi

# ── Check 3: Netlify build cache configured (only when netlify.toml exists) ──
if [ ! -f netlify.toml ]; then
  check "Netlify build cache (.next/cache) present in netlify.toml" "pass" "netlify.toml not used in this deployment"
elif grep -q '\[\[build\.cache\]\]' netlify.toml && grep -q '\.next/cache' netlify.toml; then
  check "Netlify build cache (.next/cache) present in netlify.toml" "pass"
else
  check "Netlify build cache (.next/cache) present in netlify.toml" "fail"
fi

# ── Check 4: typescript.ignoreBuildErrors present ────────────────────────────
if grep -q 'ignoreBuildErrors' next.config.mjs; then
  check "typescript.ignoreBuildErrors set in next.config.mjs" "pass"
else
  check "typescript.ignoreBuildErrors set in next.config.mjs" "fail" \
    "Add typescript: { ignoreBuildErrors: true } to next.config.mjs"
fi

# ── Check 5: one canonical Marketing worker plus inert legacy shim ────────────
if grep -q '__CACHE_VERSION__' public/sw-marketing.js; then
  check "Marketing worker uses __CACHE_VERSION__ placeholder" "pass"
else
  check "Marketing worker uses __CACHE_VERSION__ placeholder" "fail"
fi
if grep -q 'LEGACY_WORKER_RETIREMENT' public/sw.js && ! grep -q "addEventListener('fetch'" public/sw.js; then
  check "Legacy sw.js is a non-fetching retirement shim" "pass"
else
  check "Legacy sw.js is a non-fetching retirement shim" "fail"
fi

# ── Check 6: stamp-sw.mjs wired into build script ────────────────────────────
if grep -q 'stamp-sw.mjs' package.json; then
  check "stamp-sw.mjs runs before next build (package.json)" "pass"
else
  check "stamp-sw.mjs runs before next build (package.json)" "fail" \
    "Add 'node scripts/stamp-sw.mjs &&' before 'next build' in package.json"
fi

echo ""
if [ $result -eq 0 ]; then
  echo "All checks passed."
else
  echo "One or more checks failed."
fi

exit $result
