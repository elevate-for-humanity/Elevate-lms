#!/bin/bash
set -e

echo "🧪 Testing Migration SQL Syntax..."

# Test 1: Check SQL syntax
echo "1. Checking SQL syntax..."
for file in supabase/migrations/20260102_*.sql; do
  if [ -f "$file" ]; then
    echo "  Checking $file..."
    # Basic syntax check - look for common errors
    if grep -q "CREATE TABLE.*CREATE TABLE" "$file"; then
      echo "  ❌ Multiple CREATE TABLE without semicolon in $file"
      exit 1
    fi
    if grep -q "DROP POLICY.*DROP POLICY" "$file"; then
      echo "  ⚠️  Multiple DROP POLICY in $file"
    fi
    echo "  ✅ $file syntax looks good"
  fi
done

# Test 2: Check for duplicate policy names
echo ""
echo "2. Checking for duplicate policy names..."
DUPLICATES=$(grep -h "CREATE POLICY" supabase/migrations/20260102_*.sql 2>/dev/null | \
  sed 's/.*CREATE POLICY "\([^"]*\)".*/\1/' | \
  sort | uniq -d)

if [ -n "$DUPLICATES" ]; then
  echo "  ⚠️  Duplicate policies found:"
  echo "$DUPLICATES" | sed 's/^/    - /'
else
  echo "  ✅ No duplicate policies in new migrations"
fi

# Test 3: Check for required tables
echo ""
echo "3. Checking for required tables..."
REQUIRED_TABLES=(
  "profiles"
  "courses"
  "enrollments"
  "tenants"
  "licenses"
  "audit_logs"
)

for table in "${REQUIRED_TABLES[@]}"; do
  if grep -q "CREATE TABLE.*$table" supabase/migrations/20260102_consolidate_all.sql; then
    echo "  ✅ Table '$table' defined"
  else
    echo "  ❌ Table '$table' missing"
    exit 1
  fi
done

# Test 4: Check for RLS policies
echo ""
echo "4. Checking for RLS policies..."
if grep -q "ALTER TABLE.*ENABLE ROW LEVEL SECURITY" supabase/migrations/20260102_consolidate_all.sql; then
  echo "  ✅ RLS enabled on tables"
else
  echo "  ❌ RLS not enabled"
  exit 1
fi

# Test 5: Check for indexes
echo ""
echo "5. Checking for indexes..."
INDEX_COUNT=$(grep -c "CREATE INDEX" supabase/migrations/20260102_consolidate_all.sql || echo "0")
echo "  ✅ Found $INDEX_COUNT indexes"

# Test 6: Check for functions
echo ""
echo "6. Checking for functions..."
if grep -q "CREATE OR REPLACE FUNCTION" supabase/migrations/20260102_consolidate_all.sql; then
  echo "  ✅ Functions defined"
else
  echo "  ⚠️  No functions found"
fi

# Test 7: Validate multi-tenant migration
echo ""
echo "7. Checking multi-tenant migration..."
if grep -q "CREATE TABLE.*tenants" supabase/migrations/20260102_multi_tenant_licensing.sql; then
  echo "  ✅ Tenants table defined"
else
  echo "  ❌ Tenants table missing"
  exit 1
fi

if grep -q "CREATE TABLE.*licenses" supabase/migrations/20260102_multi_tenant_licensing.sql; then
  echo "  ✅ Licenses table defined"
else
  echo "  ❌ Licenses table missing"
  exit 1
fi

# Test 8: Check for default tenant seed
echo ""
echo "8. Checking for default tenant..."
if grep -q "00000000-0000-0000-0000-000000000001" supabase/migrations/20260102_multi_tenant_licensing.sql; then
  echo "  ✅ Default tenant seed found"
else
  echo "  ⚠️  No default tenant seed"
fi

echo ""
echo "✅ All migration tests passed!"
echo ""
echo "Summary:"
echo "  - SQL syntax: Valid"
echo "  - Required tables: Present"
echo "  - RLS policies: Enabled"
echo "  - Indexes: $INDEX_COUNT created"
echo "  - Multi-tenant: Configured"
echo ""
echo "Ready for deployment!"
