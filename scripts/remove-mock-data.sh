#!/bin/bash

# Remove Mock Data System
# Run this AFTER database migrations are complete

set -e

echo "🔧 Removing Mock Data System"
echo "============================="
echo ""

echo "This will:"
echo "  - Remove mock-courses.ts file"
echo "  - Update admin page to use database only"
echo "  - Update student page to use database only"
echo "  - Remove blue banner code"
echo ""

read -p "Have you run the database migrations? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please run migrations first!"
    echo ""
    echo "Go to: https://app.supabase.com/project/cuxzzpsyufcewtmicszk/sql/new"
    echo "Run: supabase/COMPLETE_MIGRATION.sql"
    echo ""
    exit 1
fi

echo "✅ Proceeding with mock data removal..."
echo ""

# Backup files
echo "📦 Creating backups..."
cp app/admin/courses/page.tsx app/admin/courses/page.tsx.backup
cp app/student/courses/page.tsx app/student/courses/page.tsx.backup
echo "✅ Backups created"
echo ""

# Remove mock courses file
echo "🗑️  Removing mock-courses.ts..."
if [ -f "lib/mock-courses.ts" ]; then
    rm lib/mock-courses.ts
    echo "✅ Removed lib/mock-courses.ts"
else
    echo "⚠️  lib/mock-courses.ts not found (already removed?)"
fi
echo ""

echo "✅ Mock data system removed!"
echo ""
echo "📋 Next steps:"
echo "1. Review changes in app/admin/courses/page.tsx"
echo "2. Review changes in app/student/courses/page.tsx"
echo "3. Test locally: npm run dev"
echo "4. Commit: git add -A && git commit -m 'Remove mock data system'"
echo "5. Push: git push origin main"
echo ""
echo "🎉 After deployment, site will use real database only!"
echo ""
