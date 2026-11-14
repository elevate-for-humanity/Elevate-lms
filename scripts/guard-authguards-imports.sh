#!/usr/bin/env bash
# guard-authguards-imports.sh
#
# Fails if any API route imports from the deprecated @/lib/authGuards.
# Page components and layouts are allowed to import from authGuards.
#
# Run: bash scripts/guard-authguards-imports.sh
# CI:  added to "lint:guards" in package.json

set -euo pipefail

MATCHES=$(grep -rn \
  "from '@/lib/authGuards'\|from \"@/lib/authGuards\"" \
  app/api \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  2>/dev/null || true)

if [[ -n "$MATCHES" ]]; then
  echo "❌ API routes must not import from @/lib/authGuards (use @/lib/admin/guards):"
  echo ""
  echo "$MATCHES"
  exit 1
fi

echo "✅ No API routes import from deprecated @/lib/authGuards"
