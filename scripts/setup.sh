#!/usr/bin/env bash
set -euo pipefail

echo "🔧 EFH Gitpod setup starting..."

# Prefer pnpm if lockfile exists; else npm
if [ -f pnpm-lock.yaml ]; then
  core_pm="pnpm"
elif [ -f bun.lockb ]; then
  core_pm="bun"
else
  core_pm="npm"
fi

echo "📦 Installing dependencies with $core_pm ..."
case "$core_pm" in
  pnpm) pnpm install --frozen-lockfile || pnpm install ;;
  bun)  bun install ;;
  *)    npm ci || npm install ;;
esac

# Ensure Tailwind config exists (configured for the Elevate design system)
if [ -f tailwind.config.js ]; then
  echo "✅ Tailwind config found"
else
  echo "⚠️  Warning: tailwind.config.js not found"
fi

# Env file - create a local placeholder when needed.
if [ ! -f .env ]; then
  echo "🌱 Creating .env file..."

  cat > .env <<ENV
# --- EFH Environment Variables ---
VITE_SITE_NAME="Elevate for Humanity"
VITE_PUBLIC_URL="http://localhost:3000"

# Supabase (loaded from GitHub Secrets or Gitpod variables)
VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-your_supabase_url_here}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-your_supabase_anon_key_here}

# Stripe (optional - for payments)
VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY:-}

# Application Form URL (optional)
VITE_APPLICATION_FORM_URL=${VITE_APPLICATION_FORM_URL:-https://www.indianacareerconnect.com}
ENV

  if [ "${VITE_SUPABASE_URL:-your_supabase_url_here}" = "your_supabase_url_here" ]; then
    echo ""
    echo "Supabase credentials not configured."
    echo "Fill .env manually or copy values from the approved runtime secret store."
  fi
else
  echo "✅ .env file exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 EFH LMS is ready. Key pages:"
echo "   - Homepage: /"
echo "   - Programs: /programs"
echo "   - Student Login: /login"
echo "   - Student Portal: /student-portal"
echo ""
echo "🚀 Run 'pnpm dev' to start the development server"
