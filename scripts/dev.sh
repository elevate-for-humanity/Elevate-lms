#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting EFH LMS dev server..."
echo ""
echo "📱 Preview will open automatically in Gitpod"
echo "🔗 Student Portal: /student-portal"
echo "🔑 Login: /login"
echo ""

# Use --host for Gitpod external URLs
if [ -f pnpm-lock.yaml ]; then
  pnpm run dev -- --host
elif [ -f bun.lockb ]; then
  bunx vite --host
else
  npm run dev -- --host
fi
