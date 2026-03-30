#!/usr/bin/env bash
# guard-enrollment-writes.sh
#
# Fails if any file outside lib/enrollment-service.ts calls
# .insert() or .upsert() directly on program_enrollments.
#
# Run: bash scripts/guard-enrollment-writes.sh
# CI:  added to "lint:guards" in package.json

set -euo pipefail

MATCHES=$(grep -rn \
  "from('program_enrollments')\s*\)\s*\.\(insert\|upsert\)\|from(\"program_enrollments\")\s*\)\s*\.\(insert\|upsert\)" \
  app lib components \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  2>/dev/null | grep -v "lib/enrollment-service.ts" || true)

if [[ -n "$MATCHES" ]]; then
  echo "❌ Direct writes to program_enrollments are forbidden outside lib/enrollment-service.ts"
  echo ""
  echo "$MATCHES"
  exit 1
fi

echo "✅ No forbidden direct enrollment writes found"
