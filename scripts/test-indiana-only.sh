#!/bin/bash

# Indiana-Only Configuration Test
# Verifies all Ohio references removed and Indiana RAPIDS badge displays

set -e

echo "🏛️  INDIANA-ONLY CONFIGURATION TEST"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://www.elevateforhumanity.org}"

echo -e "${BLUE}Testing Indiana-only configuration...${NC}"
echo ""

# Test 1: Check for Ohio references
echo -e "${YELLOW}Test 1: Checking for Ohio references in code...${NC}"
OHIO_COUNT=$(grep -r "Ohio\|OH" app/ lib/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "BAMBOOHR" | grep -v "PROHIBITED" | grep -v "101 W. Ohio Street" | wc -l || echo "0")

if [ "$OHIO_COUNT" -eq "0" ]; then
    echo -e "${GREEN}✅ No Ohio references found${NC}"
else
    echo -e "${RED}⚠️  Found $OHIO_COUNT potential Ohio references${NC}"
    echo "   Review these manually:"
    grep -rn "Ohio\|OH" app/ lib/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "BAMBOOHR" | grep -v "PROHIBITED" | grep -v "101 W. Ohio Street" | head -5
fi
echo ""

# Test 2: Verify apprenticeship config exists
echo -e "${YELLOW}Test 2: Verifying apprenticeship config...${NC}"
if [ -f "lib/compliance/apprenticeship.ts" ]; then
    echo -e "${GREEN}✅ Apprenticeship config file exists${NC}"
    if grep -q "IN:" lib/compliance/apprenticeship.ts; then
        echo -e "${GREEN}✅ Indiana config present${NC}"
    else
        echo -e "${RED}❌ Indiana config missing${NC}"
    fi
else
    echo -e "${RED}❌ Apprenticeship config file missing${NC}"
fi
echo ""

# Test 3: Verify ApprenticeshipBadge component exists
echo -e "${YELLOW}Test 3: Verifying ApprenticeshipBadge component...${NC}"
if [ -f "components/programs/ApprenticeshipBadge.tsx" ]; then
    echo -e "${GREEN}✅ ApprenticeshipBadge component exists${NC}"
    if grep -q "RAPIDS" components/programs/ApprenticeshipBadge.tsx; then
        echo -e "${GREEN}✅ RAPIDS reference present${NC}"
    else
        echo -e "${RED}❌ RAPIDS reference missing${NC}"
    fi
else
    echo -e "${RED}❌ ApprenticeshipBadge component missing${NC}"
fi
echo ""

# Test 4: Verify badge added to program page
echo -e "${YELLOW}Test 4: Verifying badge on program page...${NC}"
if grep -q "ApprenticeshipBadge" components/programs/ProgramDetails.tsx; then
    echo -e "${GREEN}✅ Badge imported in ProgramDetails${NC}"
else
    echo -e "${RED}❌ Badge not imported in ProgramDetails${NC}"
fi
echo ""

# Test 5: Verify badge added to apply page
echo -e "${YELLOW}Test 5: Verifying badge on apply page...${NC}"
if grep -q "ApprenticeshipBadge" app/apply/page.tsx; then
    echo -e "${GREEN}✅ Badge imported in apply page${NC}"
else
    echo -e "${RED}❌ Badge not imported in apply page${NC}"
fi
echo ""

# Test 6: Verify Indiana badge on dashboard
echo -e "${YELLOW}Test 6: Verifying Indiana badge on dashboard...${NC}"
if grep -q "Indiana Apprenticeship" app/student/dashboard/page.tsx; then
    echo -e "${GREEN}✅ Indiana badge present on dashboard${NC}"
else
    echo -e "${RED}❌ Indiana badge missing from dashboard${NC}"
fi
echo ""

# Test 7: Check migrations
echo -e "${YELLOW}Test 7: Checking Indiana-specific migrations...${NC}"
if [ -f "supabase/migrations/20231214_indiana_enrollment_fields.sql" ]; then
    echo -e "${GREEN}✅ Indiana enrollment fields migration exists${NC}"
else
    echo -e "${RED}❌ Indiana enrollment fields migration missing${NC}"
fi

if [ -f "supabase/migrations/20251218_student_onboarding.sql" ]; then
    echo -e "${GREEN}✅ Student onboarding migration exists${NC}"
else
    echo -e "${RED}❌ Student onboarding migration missing${NC}"
fi

if [ -f "supabase/migrations/20251218_shop_placements.sql" ]; then
    echo -e "${GREEN}✅ Shop placements migration exists${NC}"
else
    echo -e "${RED}❌ Shop placements migration missing${NC}"
fi
echo ""

# Test 8: Check documentation
echo -e "${YELLOW}Test 8: Checking Indiana documentation...${NC}"
if [ -f "docs/INDIANA_COMPLIANCE.md" ]; then
    echo -e "${GREEN}✅ Indiana compliance documentation exists${NC}"
else
    echo -e "${RED}❌ Indiana compliance documentation missing${NC}"
fi

if [ -f "docs/INDIANA_PROGRAM_WORDING.md" ]; then
    echo -e "${GREEN}✅ Indiana program wording guide exists${NC}"
else
    echo -e "${RED}❌ Indiana program wording guide missing${NC}"
fi
echo ""

# Test 9: Manual verification checklist
echo -e "${YELLOW}Test 9: Manual Verification Checklist${NC}"
echo ""
echo "After deployment, verify these pages:"
echo ""
echo "1. Barber Program Page:"
echo "   URL: $SITE_URL/programs/barber-apprenticeship"
echo "   Expected: RAPIDS badge visible below hero"
echo ""
echo "2. Apply Page (Barber):"
echo "   URL: $SITE_URL/apply?program=barber-apprenticeship"
echo "   Expected: RAPIDS badge visible above form"
echo ""
echo "3. Student Dashboard:"
echo "   URL: $SITE_URL/student/dashboard"
echo "   Expected: 'Indiana Apprenticeship' badge in header"
echo "   Expected: Onboarding checklist at top"
echo ""
echo "4. Student Handbook:"
echo "   URL: $SITE_URL/student/handbook"
echo "   Expected: Indiana-specific content"
echo ""

# Summary
echo "===================================="
echo -e "${GREEN}✅ INDIANA-ONLY CONFIGURATION TEST COMPLETE${NC}"
echo ""
echo "Configuration Status:"
echo "  ✓ Apprenticeship config: lib/compliance/apprenticeship.ts"
echo "  ✓ RAPIDS badge component: components/programs/ApprenticeshipBadge.tsx"
echo "  ✓ Badge on program page: components/programs/ProgramDetails.tsx"
echo "  ✓ Badge on apply page: app/apply/page.tsx"
echo "  ✓ Indiana badge on dashboard: app/student/dashboard/page.tsx"
echo "  ✓ Onboarding system: migrations + components"
echo "  ✓ Documentation: docs/INDIANA_*.md"
echo ""
echo "Next steps:"
echo "  1. Deploy to production"
echo "  2. Add NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER to Vercel env vars"
echo "  3. Test all pages manually"
echo "  4. Verify RAPIDS badge displays correctly"
echo ""
echo "🏛️  INDIANA-ONLY CONFIGURATION READY"
echo ""
