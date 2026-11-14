#!/usr/bin/env bash
# Auto-run Supabase migrations + seed in one command
# Usage:
#   npm run db:migrate   → apply migrations only
#   npm run db:seed      → run seed only
#   npm run db:setup     → apply migrations + seed

set -euo pipefail

CMD="${1:-setup}"

# ---- CONFIG ----
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"

MIGRATIONS_DIR="supabase/migrations"
SEEDS_DIR="supabase/seeds"

# ---- CHECK IF WE SHOULD USE NODE.JS RUNNER ----
if [ -n "$SUPABASE_DB_URL" ]; then
  echo "🔧 Using Node.js migration runner (SUPABASE_DB_URL is set)"
  
  run_migrations_node() {
    echo "🚀 Running migrations via Node.js..."
    node scripts/db/runMigrations.js
    echo "✅ Migrations applied."
  }

  run_seed_node() {
    echo "🌱 Seeding database via Node.js..."
    node scripts/db/runSeeds.js
    echo "✅ Seed applied."
  }

  case "$CMD" in
    migrate)
      run_migrations_node
      ;;
    seed)
      run_seed_node
      ;;
    setup)
      run_migrations_node
      run_seed_node
      ;;
    *)
      echo "Usage: $0 {migrate|seed|setup}"
      exit 1
      ;;
  esac
  
  exit 0
fi

# ---- FALLBACK TO SUPABASE CLI ----
echo "🔧 Using Supabase CLI (SUPABASE_DB_URL not set)"

# ---- CHECK TOOLS ----
if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
  echo "   Or set SUPABASE_DB_URL to use Node.js runner instead"
  exit 1
fi

# ---- LOGIN (NON-INTERACTIVE) ----
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "⚠️  SUPABASE_ACCESS_TOKEN not set. If you're already logged-in, this is fine."
else
  supabase login --token "$SUPABASE_ACCESS_TOKEN" >/dev/null 2>&1 || true
fi

# ---- LINK PROJECT ----
if [ -n "$SUPABASE_PROJECT_REF" ]; then
  echo "🔗 Linking to project: $SUPABASE_PROJECT_REF"
  supabase link --project-ref "$SUPABASE_PROJECT_REF" >/dev/null 2>&1 || true
fi

run_migrations() {
  echo "🚀 Running Supabase migrations with CLI…"
  supabase db push
  echo "✅ Migrations applied."
}

run_seed() {
  if [ ! -d "$SEEDS_DIR" ]; then
    echo "⚠️  Seeds directory $SEEDS_DIR not found, skipping seed."
    return 0
  fi

  echo "🌱 Seeding database…"

  # Get local db connection string from supabase config
  DB_URL=$(supabase status --json 2>/dev/null | jq -r '.services.db.url' 2>/dev/null || echo "")

  if [ -z "$DB_URL" ] || [ "$DB_URL" = "null" ]; then
    echo "⚠️  Could not resolve local DB URL from supabase config."
    echo "   Using SUPABASE_DB_URL if available..."
    DB_URL="$SUPABASE_DB_URL"
  fi

  if [ -z "$DB_URL" ]; then
    echo "❌ No database URL available. Set SUPABASE_DB_URL or start local Supabase."
    exit 1
  fi

  # psql must be installed
  if ! command -v psql >/dev/null 2>&1; then
    echo "❌ psql not found. Install PostgreSQL client tools."
    exit 1
  fi

  # Run all seed files in order
  for SEED_FILE in "$SEEDS_DIR"/*.sql; do
    if [ -f "$SEED_FILE" ]; then
      echo "  📝 Applying: $(basename "$SEED_FILE")"
      PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "$DB_URL" -f "$SEED_FILE" || {
        echo "  ⚠️  Failed to apply $(basename "$SEED_FILE"), continuing..."
      }
    fi
  done

  echo "✅ Seed applied."
}

case "$CMD" in
  migrate)
    run_migrations
    ;;
  seed)
    run_seed
    ;;
  setup)
    run_migrations
    run_seed
    ;;
  *)
    echo "Usage: $0 {migrate|seed|setup}"
    exit 1
    ;;
esac
