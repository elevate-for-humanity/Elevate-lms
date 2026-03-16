#!/usr/bin/env bash
# scripts/audit-env-vars.sh
# Reports env vars referenced in code but absent from .env.example.
# These are undocumented runtime dependencies — missing any of them
# causes silent failures or 500s in production.
# Usage: bash scripts/audit-env-vars.sh
# Exit code: 0 = all documented, 1 = gaps found

set -euo pipefail

# Extract all process.env.VAR_NAME references from source
grep -rh "process\.env\." app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -oP "process\.env\.[A-Z_]+" \
  | sed 's/process\.env\.//' \
  | grep -vE "^NODE_ENV$|^NEXT_PUBLIC_" \
  | sort -u > /tmp/_code_env.txt

# Extract keys from .env.example
grep -v "^#" .env.example 2>/dev/null | grep "=" | awk -F= '{print $1}' | sed 's/[[:space:]]//g' | sort -u > /tmp/_example_env.txt

GAPS=$(bash -c "comm -23 <(sort /tmp/_code_env.txt) <(sort /tmp/_example_env.txt)" | wc -l)

echo "=== Elevate LMS — Env Var Audit ==="
echo "Referenced in code: $(wc -l < /tmp/_code_env.txt)"
echo "Documented in .env.example: $(wc -l < /tmp/_example_env.txt)"
echo "Undocumented (in code, not in .env.example): $GAPS"
echo ""

if [ "$GAPS" -gt 0 ]; then
  echo "--- Undocumented env vars ---"
  bash -c "comm -23 <(sort /tmp/_code_env.txt) <(sort /tmp/_example_env.txt)"
  echo ""
  echo "ACTION: Add these to .env.example with placeholder values."
  exit 1
fi

echo "All env vars are documented."
exit 0
