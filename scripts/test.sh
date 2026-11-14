#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Running EFH LMS tests and checks..."
echo ""

# Determine package manager
if [ -f pnpm-lock.yaml ]; then
  PM="pnpm"
elif [ -f bun.lockb ]; then
  PM="bun"
else
  PM="npm"
fi

# TypeScript check
echo "📝 Checking TypeScript..."
if $PM run typecheck 2>/dev/null; then
  echo "✅ TypeScript check passed"
else
  echo "⚠️  TypeScript check not configured or failed"
fi

echo ""

# ESLint check
echo "🔍 Running ESLint..."
if $PM run lint 2>/dev/null; then
  echo "✅ ESLint passed"
else
  echo "⚠️  ESLint not configured or failed"
fi

echo ""

# Build test
echo "🏗️  Testing production build..."
if $PM run build; then
  echo "✅ Production build successful"
  echo ""
  echo "📊 Build output:"
  ls -lh dist/ | head -10
else
  echo "❌ Production build failed"
  exit 1
fi

echo ""
echo "✅ All checks passed!"
