#!/usr/bin/env bash
# Fail CI if PLATFORM_DEFAULTS appears as literal text in JSX attrs or single-quoted strings.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAIL=0

echo "== PLATFORM_DEFAULTS leak audit =="

# Use grep if rg not available, with fallback
GREP_CMD="rg"
if ! command -v rg &> /dev/null; then
  GREP_CMD="grep"
fi

# Check 1: JSX alt/title with double quotes containing PLATFORM_DEFAULTS
if ${GREP_CMD} -nE 'alt="[^"]*\{PLATFORM_DEFAULTS|alt="\$\{PLATFORM_DEFAULTS' app components -G '*.tsx' -G '*.jsx' 2>/dev/null; then
  echo "❌ JSX alt/title double-quote leaks"
  FAIL=1
fi

# Check 2: Single-quoted template literals
${GREP_CMD} -n "'\\\${PLATFORM_DEFAULTS" app components app/layout.tsx -G '*.tsx' -G '*.ts' 2>/dev/null | \
  ${GREP_CMD} -v 'encodeURIComponent|notifications/templates|lib/notifications' || true

LEAKS=$(${GREP_CMD} -n "'\\\${PLATFORM_DEFAULTS" app/layout.tsx components/home app/page.tsx app/programs/page.tsx -G '*.tsx' 2>/dev/null || true)
if [ -n "$LEAKS" ]; then
  echo "$LEAKS"
  echo "❌ Single-quoted \${PLATFORM_DEFAULTS...} (use backticks)"
  FAIL=1
fi

if [ "$FAIL" -eq 0 ]; then
  echo "✅ No PLATFORM_DEFAULTS leaks in critical paths"
fi
exit "$FAIL"
