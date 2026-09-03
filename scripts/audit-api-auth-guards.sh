#!/usr/bin/env bash
# Lists route files that call apiRequireAdmin but do not check auth.error (or authResult.error).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

shopt -s globstar nullglob
missing=0

while IFS= read -r f; do
  if ! grep -qE '(auth|admin|authResult|gate)\.error' "$f"; then
    echo "$f"
    missing=$((missing + 1))
  fi
done < <(rg -l 'apiRequireAdmin' app apps 2>/dev/null || true)

echo "---"
echo "Files missing auth.error check: $missing"
if [[ "$missing" -gt 0 ]]; then
  exit 1
fi
exit 0
