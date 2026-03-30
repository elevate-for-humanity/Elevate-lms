#!/usr/bin/env bash
# guard-admin-routes.sh
#
# Fails if any route under app/api/admin/ lacks an apiRequireAdmin call.
# Exits 1 with a list of offending files.
#
# Run: bash scripts/guard-admin-routes.sh
# CI:  added to "lint:guards" in package.json

set -euo pipefail

FAILED=0
MISSING=()

while IFS= read -r file; do
  if ! grep -q "apiRequireAdmin" "$file" 2>/dev/null; then
    MISSING+=("$file")
    FAILED=1
  fi
done < <(find app/api/admin -name "route.ts" | sort)

if [[ "$FAILED" -eq 1 ]]; then
  echo "❌ Admin routes missing apiRequireAdmin:"
  echo ""
  for f in "${MISSING[@]}"; do
    echo "  $f"
  done
  echo ""
  echo "Add: await apiRequireAdmin(request); from '@/lib/admin/guards'"
  exit 1
fi

echo "✅ All $(find app/api/admin -name 'route.ts' | wc -l | tr -d ' ') admin routes contain apiRequireAdmin"
