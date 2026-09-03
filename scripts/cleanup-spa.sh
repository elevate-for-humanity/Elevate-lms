#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Starting SPA cleanup..."

# 1) remove CRA/Vite configs
echo "Removing CRA/Vite configs..."
rm -f vite.config.* vite-env.d.ts craco.config.js config-overrides.js react-app-env.d.ts setupProxy.js

# 2) remove index.html at root or public if SPA-only
echo "Removing SPA index.html..."
[ -f index.html ] && rm -f index.html || true
[ -f public/index.html ] && rm -f public/index.html || true

# 3) drop SPA testing libs & PWA boilerplate
echo "Removing SPA dependencies..."
pnpm remove react-scripts workbox-* @testing-library/* web-vitals 2>/dev/null || true

# 4) prune node_modules + lockfile to avoid ghost deps
echo "Pruning node_modules..."
rm -rf node_modules
pnpm install

# 5) search for leftover SPA signatures
echo "Scanning for SPA remnants..."
if command -v rg &> /dev/null; then
  rg -n "create-react-app|serviceWorker|registerServiceWorker|Vite|import\.meta\.env" || echo "✅ No SPA remnants found"
else
  echo "⚠️  ripgrep not installed, skipping scan"
fi

echo "✅ SPA cleanup complete!"
