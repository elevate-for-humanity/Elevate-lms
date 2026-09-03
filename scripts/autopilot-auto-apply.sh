#!/usr/bin/env bash
set -euo pipefail

echo "🤖 Fully Autonomous Autopilot - Applying Migrations..."
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "   Install: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Get project ref from .env
PROJECT_REF="cuxzzpsyufcewtmicszk"
if [ -f .env ]; then
    PROJECT_REF=$(grep VITE_SUPABASE_URL .env | cut -d'/' -f3 | cut -d'.' -f1 || echo "cuxzzpsyufcewtmicszk")
fi

echo "📍 Project: $PROJECT_REF"
echo ""

# Check if already linked
if [ ! -f .supabase/config.toml ]; then
    echo "🔗 Linking to Supabase project..."
    
    # Check for access token
    if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
        echo "⚠️  SUPABASE_ACCESS_TOKEN not set"
        echo ""
        echo "To enable fully autonomous mode:"
        echo "1. Get your access token: https://supabase.com/dashboard/account/tokens"
        echo "2. Set environment variable:"
        echo "   export SUPABASE_ACCESS_TOKEN=your_token_here"
        echo ""
        echo "Or run manually:"
        echo "   supabase login"
        echo "   supabase link --project-ref $PROJECT_REF"
        echo ""
        exit 1
    fi
    
    supabase link --project-ref "$PROJECT_REF" || {
        echo "❌ Failed to link project"
        echo "   Try: supabase login"
        exit 1
    }
fi

echo "✅ Project linked"
echo ""

# Apply migrations
echo "🚀 Applying migrations..."
echo ""

# Use db push to apply all migrations
supabase db push || {
    echo ""
    echo "⚠️  Migration failed via CLI"
    echo ""
    echo "📋 Manual approach:"
    echo "1. Open: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
    echo "2. Copy: supabase/migrations/ALL_IN_ONE__paste_into_dashboard.sql"
    echo "3. Paste and click 'Run'"
    echo ""
    exit 1
}

echo ""
echo "✅ Migrations applied successfully!"
echo ""

# Verify
echo "🔍 Verifying tables..."
node scripts/autopilot-migrate.mjs || {
    echo ""
    echo "⚠️  Verification found issues"
    echo "   Check Supabase dashboard for details"
    exit 1
}

echo ""
echo "🎉 AUTOPILOT SUCCESS!"
echo "   All migrations applied and verified"
echo ""
echo "📚 Next steps:"
echo "   1. Add your first course: see QUICK_START_ADD_COURSE.md"
echo "   2. Test enrollment: go to /programs on your site"
echo ""
