#!/usr/bin/env bash
set -euo pipefail

# Full Next.js site healthcheck for Gitpod / CI
# Runs:
#  - lint
#  - type-check (if exists)
#  - unit tests (if exists)
#  - e2e tests (if exists)
#  - build
#  - optional Lighthouse check (if requested)

ROOT_DIR="${1:-.}"
cd "$ROOT_DIR"

echo "🚀 Elevate For Humanity - Full Site Healthcheck"
echo "📂 Working directory: $(pwd)"
echo

# Helper: run npm script only if it exists
run_npm_script_if_exists() {
  local script_name="$1"
  if npm run | grep -q " $script_name"; then
    echo "▶️  Running: npm run $script_name"
    npm run "$script_name"
    echo "✅ Finished: $script_name"
    echo
  else
    echo "⏭️  Skipping: $script_name (no script in package.json)"
    echo
  fi
}

echo "======================================="
echo " 1) ESLint (code quality check)"
echo "   - Catches bad imports, unused vars,"
echo "     React hook misuse, etc."
echo "======================================="
run_npm_script_if_exists "lint"

echo "======================================="
echo " 2) TypeScript type-check"
echo "   - Ensures no type errors across .ts/.tsx"
echo "======================================="
run_npm_script_if_exists "type-check"

echo "======================================="
echo " 3) Unit tests"
echo "   - Jest/Vitest component & logic tests"
echo "======================================="
run_npm_script_if_exists "test"

echo "======================================="
echo " 4) E2E tests"
echo "   - Playwright/Cypress full user flows"
echo "======================================="
run_npm_script_if_exists "test:e2e"

echo "======================================="
echo " 5) Next.js build"
echo "   - Compiles app, checks for broken imports,"
echo "     invalid server components, route issues, etc."
echo "======================================="
run_npm_script_if_exists "build"

echo "✅ Base healthcheck complete."

# Optional Lighthouse run: pass URL as second arg
# Example:
#   ./scripts/run-full-healthcheck.sh . http://localhost:3000
#
# NOTE: This assumes your site is already running on that URL.

if [[ "${2:-}" != "" ]]; then
  TARGET_URL="$2"
  echo
  echo "======================================="
  echo " 6) Lighthouse performance/accessibility/SEO"
  echo "   - Target: $TARGET_URL"
  echo "======================================="

  if command -v npx >/dev/null 2>&1; then
    npx lighthouse "$TARGET_URL" --quiet --chrome-flags="--headless" || {
      echo "⚠️ Lighthouse reported issues (this is common). Check the report for details."
    }
  else
    echo "⏭️  Skipping Lighthouse (npx not available)"
  fi
fi

echo
echo "🎉 All configured checks have finished."
