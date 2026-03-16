#!/usr/bin/env bash
# scripts/audit-schema-refs.sh
# Reports DB table references in code that have no matching CREATE TABLE in migrations.
# Usage: bash scripts/audit-schema-refs.sh [--high-traffic-only]
# Exit code: 0 = no gaps found, 1 = gaps found

set -euo pipefail

HIGH_TRAFFIC_ONLY=${1:-""}
THRESHOLD=5  # minimum reference count to flag

# Extract all table names referenced via .from() or .rpc() in TS/TSX source
grep -rh "\.\(from\|rpc\)(" app/ lib/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -oP "\.(from|rpc)\(['\"]([a-z_]+)['\"]" \
  | grep -oP "['\"][a-z_]+['\"]" \
  | tr -d "'" | tr -d '"' \
  | sort | uniq -c | sort -rn > /tmp/_code_refs.txt

# Extract all table names defined via CREATE TABLE in migrations
grep -rh "CREATE TABLE" supabase/migrations/ 2>/dev/null \
  | grep -oiP "CREATE TABLE (IF NOT EXISTS )?(public\.)?([a-z_]+)" \
  | grep -oP "[a-z_]{3,}$" \
  | sort -u > /tmp/_migration_tables.txt

echo "=== Elevate LMS — Schema Reference Audit ==="
echo "Code references: $(wc -l < /tmp/_code_refs.txt) unique tables"
echo "Migration-defined tables: $(wc -l < /tmp/_migration_tables.txt)"
echo ""

GAPS=0
echo "Tables referenced in code but NOT defined in any migration (count >= ${THRESHOLD}):"
echo "-----------------------------------------------------------------------"
while IFS= read -r line; do
  count=$(echo "$line" | awk '{print $1}')
  name=$(echo "$line" | awk '{print $2}')
  if [ "$count" -ge "$THRESHOLD" ]; then
    if ! grep -qx "$name" /tmp/_migration_tables.txt; then
      echo "  $count refs  $name"
      GAPS=$((GAPS + 1))
    fi
  fi
done < /tmp/_code_refs.txt

echo ""
echo "Total gaps (>= ${THRESHOLD} refs): $GAPS"

if [ "$GAPS" -gt 0 ]; then
  echo ""
  echo "ACTION: Verify these tables exist in the live Supabase DB."
  echo "        If missing, create migrations before deploying dependent code."
  exit 1
fi

exit 0
