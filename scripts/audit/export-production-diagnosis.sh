#!/usr/bin/env bash
# Export redacted deployment diagnosis bundle for production triage.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${ROOT}/exports/diagnosis"
mkdir -p "$OUT"

cp "$ROOT/next.config.mjs" "$OUT/next.config.mjs"
cp "$ROOT/proxy.ts" "$OUT/proxy.ts"

if [ -f "$ROOT/app/sitemap.ts" ]; then cp "$ROOT/app/sitemap.ts" "$OUT/sitemap.ts"; fi
if [ -f "$ROOT/app/robots.ts" ]; then cp "$ROOT/app/robots.ts" "$OUT/robots.ts"; fi

{
  echo "# Redacted environment (keys only + safe public vars)"
  env | grep -E '^(NEXT_PUBLIC_|NODE_ENV|NORTHFLANK_|SERVICE_ROLE|PORT)=' | sed -E 's/(KEY|SECRET|TOKEN|PASSWORD)=.*/\1=***REDACTED***/i' || true
} > "$OUT/environment-redacted.txt"

{
  echo "# App route tree (page.tsx + route.ts under app/)"
  find "$ROOT/app" \( -name 'page.tsx' -o -name 'route.ts' \) | sed "s|$ROOT||" | sort
} > "$OUT/route-tree.txt"

echo "Wrote diagnosis bundle to $OUT"
