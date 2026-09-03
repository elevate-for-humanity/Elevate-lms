#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Fixing Netlify Deployment Issues"
echo "===================================="

# Check if dist exists
if [ ! -d "dist" ]; then
  echo "❌ dist/ directory not found. Running build..."
  npm run build
fi

# Verify critical files
echo ""
echo "📋 Verifying build artifacts..."
MISSING=0

check_file() {
  if [ -f "$1" ]; then
    echo "✅ $1"
  else
    echo "❌ $1 MISSING"
    MISSING=$((MISSING + 1))
  fi
}

check_file "dist/index.html"
check_file "dist/logo.svg"
check_file "dist/images/hero-training.jpg"
check_file "dist/images/og-cover.jpg"
check_file "dist/favicon.ico"

# Check SPA redirect
if grep -q "/*" netlify.toml; then
  echo "✅ SPA redirect configured"
else
  echo "❌ SPA redirect missing in netlify.toml"
  MISSING=$((MISSING + 1))
fi

# Check build command
if grep -q "pnpm build" netlify.toml; then
  echo "✅ Build command configured"
else
  echo "⚠️  Build command may need adjustment"
fi

echo ""
if [ $MISSING -eq 0 ]; then
  echo "✅ All checks passed!"
  echo ""
  echo "Next steps:"
  echo "1. Commit any changes: git add . && git commit -m 'Fix deployment'"
  echo "2. Push to trigger deploy: git push origin main"
  echo "3. Monitor Netlify dashboard"
else
  echo "❌ Found $MISSING issues. Fix them before deploying."
  exit 1
fi
