#!/bin/bash

echo "🔍 Verifying Enrollment System..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check API file exists
echo "1️⃣ Checking API endpoint..."
if [ -f "app/api/apply/route.ts" ]; then
    echo -e "${GREEN}✅ API endpoint exists${NC}"
else
    echo -e "${RED}❌ API endpoint missing${NC}"
    exit 1
fi

# 2. Check if API exports POST
if grep -q "export async function POST" app/api/apply/route.ts; then
    echo -e "${GREEN}✅ POST handler found${NC}"
else
    echo -e "${RED}❌ POST handler missing${NC}"
    exit 1
fi

# 3. Check apply page uses correct endpoint
echo ""
echo "2️⃣ Checking apply page..."
if [ -f "app/apply/page.tsx" ]; then
    if grep -q "/api/apply" app/apply/page.tsx; then
        echo -e "${GREEN}✅ Apply page uses /api/apply${NC}"
    else
        echo -e "${YELLOW}⚠️  Apply page may use old endpoint${NC}"
        echo "   Check that it POSTs to /api/apply"
    fi
else
    echo -e "${RED}❌ Apply page not found${NC}"
fi

# 4. Test API endpoint (if server is running)
echo ""
echo "3️⃣ Testing API endpoint..."
echo "   Run this command to test:"
echo ""
echo -e "${YELLOW}curl -X POST http://localhost:3000/api/apply \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"first_name\": \"Test\","
echo "    \"last_name\": \"Student\","
echo "    \"email\": \"test@example.com\","
echo "    \"phone\": \"555-555-5555\","
echo "    \"program_slug\": \"barber-apprenticeship\""
echo "  }'${NC}"
echo ""

# 5. Check database tables
echo "4️⃣ Database tables to verify in Supabase:"
echo "   - user_profiles (with role, first_name, last_name, email)"
echo "   - programs (with slug column)"
echo "   - enrollments (with student_id, program_id, status, funding_source)"
echo ""

echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Verify database tables exist in Supabase"
echo "2. Test the curl command above"
echo "3. Test enrollment through the UI at /apply"
echo "4. Check student dashboard shows enrollment"
