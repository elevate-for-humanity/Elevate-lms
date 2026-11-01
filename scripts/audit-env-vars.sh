#!/usr/bin/env bash
# scripts/audit-env-vars.sh
# Reports env vars referenced in code but absent from checked-in env example files.
# These are undocumented runtime dependencies - missing any of them
# causes silent failures or 500s in production.
# Usage: bash scripts/audit-env-vars.sh
# Exit code: 0 = all documented, 1 = gaps found

set -euo pipefail

audit_dir=$(mktemp -d)
trap 'rm -rf "$audit_dir"' EXIT
code_env_file="$audit_dir/code-env.txt"
example_env_file="$audit_dir/example-env.txt"

# Scan tracked application source. Installed dependencies and generated Next
# output are not application configuration authorities, even when beneath apps/.
git grep -I -h 'process\.env\.' -- \
  ':(glob)apps/**/*.ts' ':(glob)apps/**/*.tsx' \
  ':(glob)app-legacy/**/*.ts' ':(glob)app-legacy/**/*.tsx' \
  ':(glob)lib/**/*.ts' ':(glob)lib/**/*.tsx' > "$audit_dir/references.txt" || {
  status=$?
  if [ "$status" -ne 1 ]; then exit "$status"; fi
}
(cat "$audit_dir/references.txt" \
  | grep -v "^\s*//" \
  | grep -oP "process\.env\.[A-Z][A-Z0-9_]+" \
  | sed 's/process\.env\.//' \
  | grep -vE "^NODE_ENV$|^NEXT_PUBLIC_|^NEXT_PHASE$|^NEXT_RUNTIME$" \
  | sort -u) > "$code_env_file" || true

# Extract keys from the canonical env examples. Keep the small required-runtime
# bundle separate so new server-only dependencies can be documented without
# turning .env.example into an even larger merge hotspot.
: > "$example_env_file"
for file in .env.example .env.required.example; do
  if [ -f "$file" ]; then
    grep -v "^#" "$file" 2>/dev/null \
      | grep "=" \
      | awk -F= '{print $1}' \
      | sed 's/[[:space:]]//g' >> "$example_env_file"
  fi
done
sort -u -o "$example_env_file" "$example_env_file"

GAPS=$(comm -23 "$code_env_file" "$example_env_file" | wc -l)

echo "=== Elevate LMS - Env Var Audit ==="
echo "Referenced in code: $(wc -l < "$code_env_file")"
echo "Documented in env examples: $(wc -l < "$example_env_file")"
echo "Undocumented (in code, not in env examples): $GAPS"
echo ""

if [ "$GAPS" -gt 0 ]; then
  echo "--- Undocumented env vars ---"
  comm -23 "$code_env_file" "$example_env_file"
  echo ""
  echo "ACTION: Add these to .env.example or .env.required.example with placeholder values."
  exit 1
fi

echo "All env vars are documented."
exit 0
