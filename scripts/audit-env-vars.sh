#!/usr/bin/env bash
# scripts/audit-env-vars.sh
# Reports env vars referenced in code but absent from checked-in env example files.
# These are undocumented runtime dependencies - missing any of them
# causes silent failures or 500s in production.
# Usage: bash scripts/audit-env-vars.sh
# Exit code: 0 = all documented, 1 = gaps found

set -euo pipefail

# Extract all process.env.VAR_NAME references from source
# Search apps/*/app, app-legacy, and lib (root app/ no longer exists after split)
# grep -r with non-existent dir exits 2; suppress with subshell guard
(grep -rh "process\.env\." apps/ app-legacy/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "^\s*//" \
  | grep -oP "process\.env\.[A-Z][A-Z0-9_]+" \
  | sed 's/process\.env\.//' \
  | grep -vE "^NODE_ENV$|^NEXT_PUBLIC_|^NEXT_PHASE$|^NEXT_RUNTIME$" \
  | sort -u) > /tmp/_code_env.txt || true

# Extract keys from the canonical env examples. Keep the small required-runtime
# bundle separate so new server-only dependencies can be documented without
# turning .env.example into an even larger merge hotspot.
: > /tmp/_example_env.txt
for file in .env.example .env.required.example; do
  if [ -f "$file" ]; then
    grep -v "^#" "$file" 2>/dev/null \
      | grep "=" \
      | awk -F= '{print $1}' \
      | sed 's/[[:space:]]//g' >> /tmp/_example_env.txt
  fi
done
sort -u -o /tmp/_example_env.txt /tmp/_example_env.txt

GAPS=$(bash -c "comm -23 <(sort /tmp/_code_env.txt) <(sort /tmp/_example_env.txt)" | wc -l)

echo "=== Elevate LMS - Env Var Audit ==="
echo "Referenced in code: $(wc -l < /tmp/_code_env.txt)"
echo "Documented in env examples: $(wc -l < /tmp/_example_env.txt)"
echo "Undocumented (in code, not in env examples): $GAPS"
echo ""

if [ "$GAPS" -gt 0 ]; then
  echo "--- Undocumented env vars ---"
  bash -c "comm -23 <(sort /tmp/_code_env.txt) <(sort /tmp/_example_env.txt)"
  echo ""
  echo "ACTION: Add these to .env.example or .env.required.example with placeholder values."
  exit 1
fi

echo "All env vars are documented."
exit 0
