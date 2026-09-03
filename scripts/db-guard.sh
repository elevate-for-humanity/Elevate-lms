#!/usr/bin/env bash
set -euo pipefail

# Database Schema Guard
# Verifies table columns exist before running queries
# Usage: ./scripts/db-guard.sh [table_name]

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL (postgres connection string)}"

TABLE="${1:-programs}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Database Schema Guard - Column Verification                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Table: public.${TABLE}"
echo ""

# Check if table exists
TABLE_EXISTS=$(psql "$SUPABASE_DB_URL" -qtAX <<SQL
select exists(
  select 1
  from information_schema.tables
  where table_schema='public' and table_name='${TABLE}'
);
SQL
)

if [ "$TABLE_EXISTS" != "t" ]; then
  echo "❌ Table 'public.${TABLE}' does not exist!"
  echo ""
  echo "Available tables:"
  psql "$SUPABASE_DB_URL" -qtAX <<SQL
select table_name
from information_schema.tables
where table_schema='public'
  and table_type='BASE TABLE'
order by table_name;
SQL
  exit 1
fi

echo "✅ Table exists"
echo ""
echo "Columns in public.${TABLE}:"
echo "─────────────────────────────────────────────────────────────────"

psql "$SUPABASE_DB_URL" -t <<SQL
select
  '  ' || c.column_name || ' (' || c.data_type ||
  case
    when c.character_maximum_length is not null
    then '(' || c.character_maximum_length || ')'
    else ''
  end || ')'
from information_schema.columns c
where c.table_schema='public'
  and c.table_name='${TABLE}'
order by c.ordinal_position;
SQL

echo ""
echo "─────────────────────────────────────────────────────────────────"
echo ""
echo "💡 Tip: Verify your queries reference only these columns"
echo ""

# Check for common problematic columns
echo "Checking for common column issues:"
echo ""

COMMON_COLS=("course_id" "wholesale_cost_cents" "retail_price_cents" "title" "name" "description")

for col in "${COMMON_COLS[@]}"; do
  EXISTS=$(psql "$SUPABASE_DB_URL" -qtAX <<SQL
select exists(
  select 1
  from information_schema.columns
  where table_schema='public'
    and table_name='${TABLE}'
    and column_name='${col}'
);
SQL
  )
  
  if [ "$EXISTS" = "t" ]; then
    echo "  ✅ ${col}"
  else
    echo "  ❌ ${col} (does not exist)"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
