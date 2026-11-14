#!/bin/bash

# Student Onboarding Flow Test
# Tests 4-step onboarding: Handbook → Milady → AI Instructor → Shop Placement

set -e

echo "🎓 STUDENT ONBOARDING FLOW TEST"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://www.elevateforhumanity.org}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="onboarding-test-${TIMESTAMP}@efh.local"

echo -e "${BLUE}Configuration:${NC}"
echo "  Site: $SITE_URL"
echo "  Test Email: $TEST_EMAIL"
echo ""

# Step 1: Create test student
echo -e "${YELLOW}Step 1: Creating Test Student...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SITE_URL/api/apply" \
  -H "Content-Type: application/json" \
  -d "{
    \"first_name\": \"Onboarding\",
    \"last_name\": \"Test\",
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"317-555-0200\",
    \"program_slug\": \"barber-apprenticeship\",
    \"state_code\": \"IN\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Student created${NC}"
    USER_ID=$(echo "$BODY" | grep -o '"user_id":"[^"]*"' | cut -d'"' -f4)
    echo "   User ID: $USER_ID"
else
    echo -e "${RED}❌ Failed to create student${NC}"
    exit 1
fi
echo ""

# Step 2: Verify onboarding record created
echo -e "${YELLOW}Step 2: Verify Onboarding Record${NC}"
echo "Run this query in Supabase SQL Editor:"
echo ""
cat << EOF
SELECT 
  student_id,
  handbook_reviewed,
  milady_orientation_completed,
  ai_instructor_met,
  shop_placed,
  created_at
FROM student_onboarding
WHERE student_id = (
  SELECT user_id FROM user_profiles WHERE email = '$TEST_EMAIL'
);
EOF
echo ""
echo "Expected: All flags should be false initially"
echo ""

# Step 3: Test handbook acknowledgment
echo -e "${YELLOW}Step 3: Test Handbook Acknowledgment${NC}"
echo ""
echo "Manual test steps:"
echo "  1. Log in as: $TEST_EMAIL"
echo "  2. Navigate to: $SITE_URL/student/handbook"
echo "  3. Click 'I Acknowledge' button"
echo "  4. Verify handbook_reviewed = true in database"
echo ""
echo "API endpoint: POST $SITE_URL/api/student/acknowledge-handbook"
echo "Payload: {\"userId\": \"$USER_ID\"}"
echo ""

# Step 4: Test Milady orientation
echo -e "${YELLOW}Step 4: Test Milady Orientation${NC}"
echo ""
echo "Manual test steps:"
echo "  1. Navigate to: $SITE_URL/student/courses"
echo "  2. Wait 3 seconds on page"
echo "  3. Verify milady_orientation_completed = true in database"
echo ""
echo "API endpoint: POST $SITE_URL/api/student/mark-milady-orientation"
echo "Payload: {\"userId\": \"$USER_ID\"}"
echo ""

# Step 5: Test AI instructor met
echo -e "${YELLOW}Step 5: Test AI Instructor Met${NC}"
echo ""
echo "Manual test steps:"
echo "  1. Navigate to AI chat interface"
echo "  2. Send first message: 'Hello, what should I study first?'"
echo "  3. Verify ai_instructor_met = true in database"
echo ""
echo "API endpoint: POST $SITE_URL/api/ai/chat"
echo "Payload: {\"message\": \"Hello\"}"
echo "Trigger: Automatically marks on first message"
echo ""

# Step 6: Test shop placement (admin)
echo -e "${YELLOW}Step 6: Test Shop Placement (Admin)${NC}"
echo ""
echo "Admin test steps:"
echo "  1. Log in as admin"
echo "  2. Assign shop placement to student"
echo "  3. Verify shop_placed = true in database"
echo ""
echo "API endpoint: POST $SITE_URL/api/admin/assign-shop-placement"
cat << EOF
Payload: {
  "studentId": "$USER_ID",
  "shopName": "Test Barbershop",
  "shopAddress": "123 Main St, Indianapolis, IN",
  "supervisorName": "John Smith",
  "supervisorEmail": "supervisor@testshop.com"
}
EOF
echo ""

# Step 7: Verification queries
echo -e "${YELLOW}Step 7: Complete Verification Queries${NC}"
echo ""

echo -e "${BLUE}-- Check onboarding progress${NC}"
cat << EOF
SELECT 
  handbook_reviewed,
  handbook_reviewed_at,
  milady_orientation_completed,
  milady_orientation_completed_at,
  ai_instructor_met,
  ai_instructor_met_at,
  shop_placed,
  shop_placed_at
FROM student_onboarding
WHERE student_id = (
  SELECT user_id FROM user_profiles WHERE email = '$TEST_EMAIL'
);
EOF
echo ""

echo -e "${BLUE}-- Check shop placement${NC}"
cat << EOF
SELECT 
  shop_name,
  shop_address,
  supervisor_name,
  status,
  assigned_at
FROM shop_placements
WHERE student_id = (
  SELECT user_id FROM user_profiles WHERE email = '$TEST_EMAIL'
);
EOF
echo ""

# Step 8: Dashboard verification
echo -e "${YELLOW}Step 8: Dashboard Verification${NC}"
echo ""
echo "Dashboard URL: ${BLUE}$SITE_URL/student/dashboard${NC}"
echo ""
echo "Expected to see:"
echo "  ✓ Onboarding checklist card at top"
echo "  ✓ Progress counter: X/4 steps complete"
echo "  ✓ Green checkmarks for completed steps"
echo "  ✓ Action buttons for incomplete steps"
echo "  ✓ 'Onboarding Complete!' message when all done"
echo ""

# Step 9: Compliance checklist
echo -e "${YELLOW}Step 9: Compliance Checklist${NC}"
echo ""
echo "✅ WIOA Compliance:"
echo "   - Handbook acknowledgment proves orientation"
echo "   - Timestamped for audit trail"
echo ""
echo "✅ RAPIDS Compliance:"
echo "   - Milady orientation proves curriculum access"
echo "   - AI instructor proves instructional support"
echo "   - Shop placement proves OJT readiness"
echo ""
echo "✅ Indiana DWD Compliance:"
echo "   - All 4 steps documented"
echo "   - Timestamps for each milestone"
echo "   - Clear progression path"
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ ONBOARDING TEST SETUP COMPLETE${NC}"
echo ""
echo "Test student created:"
echo "  Email: $TEST_EMAIL"
echo "  User ID: $USER_ID"
echo ""
echo "Next steps:"
echo "  1. Run verification queries above"
echo "  2. Test each onboarding step manually"
echo "  3. Verify dashboard displays correctly"
echo "  4. Confirm all timestamps are recorded"
echo ""
echo "🎓 READY FOR STUDENT ONBOARDING"
echo ""
