#!/bin/bash
# scripts/dev-fast.sh
# Fast dev server startup - skips optional setup steps

set -e

echo "🚀 Fast Dev Server Startup"
echo "=========================="
echo ""

# Kill any existing process on port 3000
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "🔪 Killing existing process on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Quick env check (skip if already configured)
if [ -f .env.local ]; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.local 2>/dev/null; then
        echo "✅ Environment configured"
    else
        echo "⚠️  .env.local exists but may be incomplete"
        echo "   Run 'pnpm setup:env' if you encounter issues"
    fi
else
    echo "⚠️  No .env.local found"
    echo "   Run 'pnpm setup:env' to configure environment"
fi

# Skip course cover generation if covers exist
if [ -d "public/course-covers" ]; then
    echo "✅ Course covers exist, skipping generation"
else
    echo "📸 Generating course covers..."
    node scripts/generate-course-covers.mjs
fi

echo ""
echo "🎯 Starting Next.js dev server..."
echo ""

# Start Next.js (use pnpm to ensure proper PATH)
exec pnpm next dev
