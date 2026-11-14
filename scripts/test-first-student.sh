#!/bin/bash

# EFH Launch Test - First Student Enrollment
# Tests complete enrollment flow from application to dashboard

echo "🚀 EFH LAUNCH TEST - First Student Enrollment"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
TEST_EMAIL="test.student.$(date +%s)@efh-test.com"

echo -e "${BLUE}Configuration:${NC}"
echo "  Site URL: $SITE_URL"
echo "  Test Email: $TEST_EMAIL"
echo ""

# Step 1: Test enrollment API
echo -e "${YELLOW}Step 1: Testing enrollment API...${NC}"
RESPONSE=$(curl -s -X POST "$SITE_URL/api/apply" \
  -H "Content-Type: application/json" \
  -d "{
    \"first_name\": \"Test\",
    \"last_name\": \"Student\",
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"317-555-0100\",
    \"program_slug\": \"barber-apprenticeship\"
  }")

echo "Response: $RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Enrollment API successful${NC}"
    USER_ID=$(echo "$RESPONSE" | grep -o '"user_id":"[^"]*"' | cut -d'"' -f4)
    echo "   User ID: $USER_ID"
else
    echo -e "${RED}❌ Enrollment API failed${NC}"
    echo "   Check server logs for errors"
    exit 1
fi
echo ""

# Step 2: Verify database records
echo -e "${YELLOW}Step 2: Verifying database records...${NC}"
echo "   Run these queries in Supabase SQL Editor:"
echo ""
echo -e "${BLUE}-- Check user profile${NC}"
echo "SELECT * FROM user_profiles WHERE email = '$TEST_EMAIL';"
echo ""
echo -e "${BLUE}-- Check enrollment${NC}"
echo "SELECT e.*, p.name as program_name"
echo "FROM enrollments e"
echo "JOIN programs p ON e.program_id = p.id"
echo "WHERE e.student_id = (SELECT user_id FROM user_profiles WHERE email = '$TEST_EMAIL');"
echo ""
echo -e "${BLUE}-- Check AI instructor assignment${NC}"
echo "SELECT sa.*, ai.name as instructor_name"
echo "FROM student_ai_assignments sa"
echo "JOIN ai_instructors ai ON sa.instructor_id = ai.id"
echo "WHERE sa.student_id = (SELECT user_id FROM user_profiles WHERE email = '$TEST_EMAIL');"
echo ""
echo -e "${BLUE}-- Check external credentials${NC}"
echo "SELECT * FROM external_credentials"
echo "WHERE student_id = (SELECT user_id FROM user_profiles WHERE email = '$TEST_EMAIL');"
echo ""

# Step 3: Test dashboard access
echo -e "${YELLOW}Step 3: Dashboard access${NC}"
echo "   Student should be able to access:"
echo "   $SITE_URL/student/dashboard"
echo ""
echo "   Expected to see:"
echo "   ✓ Enrollment status"
echo "   ✓ Program name (Barber Apprenticeship)"
echo "   ✓ AI Instructor assignment"
echo "   ✓ Milady RISE credential"
echo "   ✓ Hours tracker"
echo ""

# Step 4: Test AI instructor
echo -e "${YELLOW}Step 4: AI Instructor chat${NC}"
echo "   Test chat endpoint:"
echo ""
echo "   curl -X POST $SITE_URL/api/ai/chat \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -H \"Authorization: Bearer <student_token>\" \\"
echo "     -d '{\"message\": \"What should I study first?\"}'"
echo ""

# Step 5: Test hour logging
echo -e "${YELLOW}Step 5: Hour logging${NC}"
echo "   Test hour logging endpoint:"
echo ""
echo "   curl -X POST $SITE_URL/api/apprenticeship/hours \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -H \"Authorization: Bearer <student_token>\" \\"
echo "     -d '{"
echo "       \"date_worked\": \"$(date +%Y-%m-%d)\","
echo "       \"hours\": 8,"
echo "       \"category\": \"on-the-job\","
echo "       \"program_slug\": \"barber-apprenticeship\""
echo "     }'"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}✅ Launch Test Complete${NC}"
echo ""
echo "Next steps:"
echo "1. Verify database records (queries above)"
echo "2. Test student dashboard access"
echo "3. Test AI instructor chat"
echo "4. Test hour logging"
echo "5. Onboard real student"
echo ""
echo "Test student credentials:"
echo "  Email: $TEST_EMAIL"
echo "  Password: (check Supabase Auth for magic link)"
echo ""
echo "Dashboard URL:"
echo "  $SITE_URL/student/dashboard"
echo ""
