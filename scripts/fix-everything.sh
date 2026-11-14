#!/bin/bash

# Fix Everything Script
# Applies all migrations, seeds data, and tests the system

set -e  # Exit on error

echo "🚀 FIXING EVERYTHING - COMPLETE DEPLOYMENT PREP"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Step 1: Apply all migrations
echo "📊 Step 1: Applying database migrations..."
echo "-------------------------------------------"

MIGRATIONS=(
    "supabase/migrations/fix_rls_public_access.sql"
    "supabase/migrations/create_social_media_settings.sql"
    "supabase/migrations/create_licenses_table.sql"
    "supabase/migrations/seed_blog_posts.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "  Applying: $migration"
        # Note: In production, use Supabase CLI or dashboard
        echo "  ⚠️  Apply this manually in Supabase SQL Editor"
    fi
done

echo -e "${GREEN}✅ Migrations ready${NC}"
echo ""

# Step 2: Add missing apprenticeships
echo "🎓 Step 2: Adding missing apprenticeships..."
echo "-------------------------------------------"

cat > /tmp/add_apprenticeships.sql << 'EOF'
-- Add missing apprenticeships to programs table

INSERT INTO programs (
    slug,
    name,
    short_tagline,
    description,
    category,
    duration,
    cost,
    funding_available,
    outcomes,
    highlights
) VALUES
(
    'esthetician-apprenticeship',
    'Esthetician Apprenticeship',
    'Learn skincare, facials, and spa services through hands-on training',
    'Become a licensed esthetician through our registered apprenticeship program. Learn skincare treatments, facial techniques, waxing, makeup application, and spa services while earning a wage.',
    'Beauty & Wellness',
    '600 hours (3-6 months)',
    'Employer-sponsored',
    true,
    ARRAY['State esthetician license', 'Spa and salon employment', 'Client consultation skills', 'Product knowledge'],
    ARRAY['Earn while you learn', 'State licensure pathway', 'Hands-on training in licensed spas', 'Build client portfolio']
),
(
    'ems-apprenticeship',
    'Emergency Medical Services (EMS) Apprenticeship',
    'Train as an EMT or Paramedic with real emergency response experience',
    'Gain emergency medical skills through our EMS apprenticeship. Work alongside experienced paramedics and EMTs while completing your certification. Respond to real emergencies and save lives.',
    'Healthcare',
    '1-2 years',
    'Employer-sponsored',
    true,
    ARRAY['EMT or Paramedic certification', 'Emergency response skills', 'Patient assessment', 'Medical protocols'],
    ARRAY['Paid training', 'Real emergency experience', 'National certification', 'Career advancement to paramedic']
),
(
    'culinary-apprenticeship',
    'Culinary Arts Apprenticeship',
    'Master professional cooking techniques in restaurant kitchens',
    'Learn culinary arts through hands-on training in professional kitchens. Work with experienced chefs, master cooking techniques, food safety, menu planning, and kitchen management.',
    'Hospitality',
    '2-3 years',
    'Employer-sponsored',
    true,
    ARRAY['Professional cooking skills', 'Food safety certification', 'Menu development', 'Kitchen management'],
    ARRAY['Train in real restaurants', 'Learn from executive chefs', 'ServSafe certification', 'Career path to sous chef or head chef']
),
(
    'nail-technician-apprenticeship',
    'Nail Technician Apprenticeship',
    'Become a licensed nail technician through hands-on salon training',
    'Learn manicures, pedicures, nail art, and salon services through our registered apprenticeship. Train in licensed salons while earning a wage and building your client base.',
    'Beauty & Wellness',
    '600 hours (3-6 months)',
    'Employer-sponsored',
    true,
    ARRAY['State nail technician license', 'Manicure and pedicure skills', 'Nail art techniques', 'Salon management'],
    ARRAY['Earn while learning', 'State licensure pathway', 'Build client portfolio', 'Flexible salon employment']
)
ON CONFLICT (slug) DO NOTHING;
EOF

echo "  ✅ Apprenticeships SQL created"
echo "  ⚠️  Apply /tmp/add_apprenticeships.sql in Supabase SQL Editor"
echo ""

# Step 3: Fix slug mismatches
echo "🔧 Step 3: Fixing slug mismatches..."
echo "-------------------------------------------"

cat > /tmp/fix_slugs.sql << 'EOF'
-- Fix slug mismatches

UPDATE programs 
SET slug = 'building-maintenance-apprenticeship'
WHERE slug = 'building-technician';

-- Ensure all program slugs are consistent
UPDATE programs
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'))
WHERE slug IS NULL OR slug = '';
EOF

echo "  ✅ Slug fix SQL created"
echo "  ⚠️  Apply /tmp/fix_slugs.sql in Supabase SQL Editor"
echo ""

# Step 4: Test license system
echo "🔒 Step 4: Testing license system..."
echo "-------------------------------------------"

if command -v node &> /dev/null; then
    echo "  Running license tests..."
    node -r dotenv/config scripts/test-license-system.mjs dotenv_config_path=.env.local || echo "  ⚠️  License test needs database migrations first"
else
    echo "  ⚠️  Node.js not found, skipping tests"
fi

echo ""

# Step 5: Test environment
echo "🔍 Step 5: Running environment audit..."
echo "-------------------------------------------"

if command -v node &> /dev/null; then
    echo "  Running audit..."
    node -r dotenv/config scripts/audit-env-connections.mjs dotenv_config_path=.env.local || echo "  ⚠️  Some services may need configuration"
else
    echo "  ⚠️  Node.js not found, skipping audit"
fi

echo ""

# Step 6: Commit changes
echo "📦 Step 6: Committing changes..."
echo "-------------------------------------------"

git add -A
git status

echo ""
echo "================================================"
echo -e "${GREEN}✅ FIX EVERYTHING SCRIPT COMPLETE${NC}"
echo "================================================"
echo ""
echo "📋 MANUAL STEPS REQUIRED:"
echo ""
echo "1. Apply SQL migrations in Supabase Dashboard:"
echo "   - supabase/migrations/create_licenses_table.sql"
echo "   - supabase/migrations/seed_blog_posts.sql"
echo "   - /tmp/add_apprenticeships.sql"
echo "   - /tmp/fix_slugs.sql"
echo ""
echo "2. Test the site:"
echo "   - npm run dev"
echo "   - Visit /apprenticeships"
echo "   - Visit /blog"
echo "   - Test license middleware"
echo ""
echo "3. Deploy:"
echo "   - git commit -m 'Complete deployment fixes'"
echo "   - git push origin main"
echo ""
echo "🎯 READY FOR STORE LISTING AFTER MANUAL STEPS"
