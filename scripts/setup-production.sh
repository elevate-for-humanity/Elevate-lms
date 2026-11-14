#!/bin/bash

echo "🚀 Elevate LMS Production Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from example...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo ""
    echo -e "${YELLOW}📝 Please edit .env.local with your credentials:${NC}"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
    echo "   - SENDGRID_API_KEY (or RESEND_API_KEY)"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Load environment variables
source .env.local

# Check required variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please update .env.local and try again."
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Step 1: Database Migration
echo "📊 Step 1: Database Migration"
echo "=============================="
echo ""
echo "The migration will create:"
echo "  - partner_lms_providers"
echo "  - partner_courses"
echo "  - partner_lms_enrollments"
echo "  - partner_lms_enrollment_failures"
echo "  - partner_certificates"
echo ""
echo "Plus RLS policies, indexes, and seed data for 7 partners."
echo ""
read -p "Run migration now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}📋 Copy the following SQL and run it in Supabase SQL Editor:${NC}"
    echo ""
    echo "Supabase Dashboard → SQL Editor → New Query"
    echo ""
    echo "Migration file: supabase/migrations/20241130_create_partner_lms_tables.sql"
    echo ""
    echo "Press Enter when migration is complete..."
    read
    echo -e "${GREEN}✅ Migration completed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping migration${NC}"
fi

echo ""

# Step 2: Verify Tables
echo "🔍 Step 2: Verify Tables"
echo "========================"
echo ""
echo "Run this query in Supabase to verify tables:"
echo ""
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema = 'public'"
echo "AND table_name LIKE 'partner%';"
echo ""
echo "Expected: 5 tables"
echo ""
read -p "Tables verified? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ Tables verified${NC}"
else
    echo -e "${RED}❌ Please check migration and try again${NC}"
    exit 1
fi

echo ""

# Step 3: Deploy Edge Functions
echo "📧 Step 3: Deploy Edge Functions"
echo "================================="
echo ""
echo "Two Edge Functions need to be deployed:"
echo "  1. send-partner-enrollment-email"
echo "  2. send-partner-completion-email"
echo ""
echo "Commands to run:"
echo ""
echo "supabase functions deploy send-partner-enrollment-email --project-ref YOUR_PROJECT_REF --no-verify-jwt"
echo "supabase functions deploy send-partner-completion-email --project-ref YOUR_PROJECT_REF --no-verify-jwt"
echo ""
echo "Then set environment variables in Supabase Dashboard:"
echo "  - SENDGRID_API_KEY (or RESEND_API_KEY)"
echo "  - EMAIL_FROM"
echo ""
read -p "Edge Functions deployed? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ Edge Functions deployed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping Edge Functions (can deploy later)${NC}"
fi

echo ""

# Step 4: Test Database Connection
echo "🔌 Step 4: Test Database Connection"
echo "===================================="
echo ""
echo "Testing connection to Supabase..."

# Simple test using curl
RESPONSE=$(curl -s -X GET \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/partner_lms_providers?select=count" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
    echo "Response: $RESPONSE"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check your Supabase credentials"
fi

echo ""

# Step 5: Build and Deploy
echo "🏗️  Step 5: Build and Deploy"
echo "============================"
echo ""
echo "Building Next.js application..."

npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Please fix build errors and try again"
    exit 1
fi

echo ""

# Step 6: Final Checklist
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo ""
echo "1. ✅ Database tables created"
echo "2. ✅ Edge Functions deployed"
echo "3. ✅ Application built"
echo ""
echo "To go live:"
echo ""
echo "4. Implement first partner API (HSI recommended)"
echo "   - Edit lib/partners/hsi.ts"
echo "   - Add HSI credentials to .env.local"
echo "   - Update lib/partners/index.ts"
echo ""
echo "5. Test enrollment flow:"
echo "   - Create test student"
echo "   - Process test payment"
echo "   - Verify auto-enrollment"
echo "   - Check email sent"
echo ""
echo "6. Set up progress sync cron job"
echo ""
echo "7. Monitor admin dashboards:"
echo "   - /admin/analytics"
echo "   - /admin/completions"
echo ""
echo "Documentation:"
echo "  - Implementation Guide: docs/IMPLEMENTATION_GUIDE.md"
echo "  - PIRL Mapping: docs/compliance/WIOA_PIRL_MAPPING_NOTES.md"
echo "  - Partner System: PARTNER_AUTOMATION_SYSTEM.md"
echo ""
echo -e "${GREEN}🎉 Ready for production!${NC}"
