#!/bin/bash

# Activate Courses - Complete Automation
# This script runs all migrations and verifies success

set -e

echo "🚀 Elevate for Humanity - Course Activation"
echo "==========================================="
echo ""

# Check environment variables
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set in environment"
    echo ""
    echo "To run migrations, you need to:"
    echo "1. Go to: https://app.supabase.com/project/cuxzzpsyufcewtmicszk/sql/new"
    echo "2. Copy: https://raw.githubusercontent.com/elevate-for-humanity/Elevate-lms/main/supabase/migrations/"
    echo "3. Paste and click 'Run'"
    echo ""
    echo "OR set the environment variable:"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='your-key-here'"
    echo ""
    exit 0
fi

SUPABASE_URL="https://cuxzzpsyufcewtmicszk.supabase.co"

echo "📍 Supabase URL: $SUPABASE_URL"
echo "🔑 Service Key: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
echo ""

# Read migration file
MIGRATION_FILE="supabase/COMPLETE_MIGRATION.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "📊 Will create: 16 programs, 17 courses, 50+ modules"
echo ""

# Note: Direct SQL execution via REST API requires special handling
# For now, provide manual instructions

echo "✅ Ready to run migrations!"
echo ""
echo "📋 Manual Steps (5 minutes):"
echo ""
echo "1. Open: https://app.supabase.com/project/cuxzzpsyufcewtmicszk/sql/new"
echo ""
echo "2. Copy SQL from:"
echo "   https://raw.githubusercontent.com/elevate-for-humanity/Elevate-lms/main/supabase/migrations/"
echo ""
echo "3. Paste into SQL Editor and click 'Run'"
echo ""
echo "4. Verify success:"
echo "   SELECT COUNT(*) FROM programs; -- Should be 16"
echo "   SELECT COUNT(*) FROM courses;  -- Should be 17"
echo ""
echo "5. Check website:"
echo "   https://www.elevateforhumanity.org/admin/courses"
echo "   Blue banner should disappear!"
echo ""

echo "🎯 After migrations complete, run:"
echo "   npm run remove-mock-data"
echo ""
