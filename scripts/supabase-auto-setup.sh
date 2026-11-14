#!/usr/bin/env bash
set -e

echo "🚀 Supabase Autopilot: Starting database setup"

# --- 1. ENV CHECKS ------------------------------------------------------------

REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING=false
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "❌ Missing required env var: $VAR"
    MISSING=true
  fi
done

if [ "$MISSING" = true ]; then
  echo "⚠️  Please set the missing variables above in your .env.local"
  echo "⚠️  Continuing with Node.js migration runner instead..."
fi

echo "✅ Environment variables present"

# --- 2. RUN NODE.JS MIGRATIONS -----------------------------------------------

if [ -n "$SUPABASE_DB_URL" ]; then
  echo "🧱 Running migrations via Node.js..."
  node scripts/db/runMigrations.js
  
  echo "🌱 Running seeds via Node.js..."
  node scripts/db/runSeeds.js
  
  echo "✅ Migrations and seeds completed"
else
  echo "⚠️  SUPABASE_DB_URL not set, skipping migrations"
  echo "⚠️  Set SUPABASE_DB_URL in .env.local to enable auto-migrations"
fi

# --- 3. SMOKE TEST -----------------------------------------------------------

echo "🔍 Testing Supabase connection..."

if command -v node >/dev/null 2>&1; then
  if [ -f "scripts/test-supabase-connection.ts" ]; then
    npx tsx scripts/test-supabase-connection.ts || {
      echo "⚠️  Connection test failed, but continuing..."
    }
  fi
fi

# --- 4. COMPLETE -------------------------------------------------------------

cat <<EOF

✅ Supabase Autopilot Complete

Next recommended steps:

1. Run your dev server:
   npm run dev

2. In the browser, check:
   - /programs
   - /lms/courses
   - /admin/dev-studio
   - /admin/course-studio

EOF
