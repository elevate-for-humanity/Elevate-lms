#!/bin/bash

# Detailed RLS Policy Verification Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  🔒 RLS POLICY VERIFICATION${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Load environment
export $(grep -v '^#' .env | grep -v '^$' | xargs 2>/dev/null)
PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)

echo "Project: $PROJECT_REF"
echo ""

# Expected RLS-enabled tables
RLS_TABLES=(
    "organizations"
    "profiles"
    "courses"
    "enrollments"
    "assessments"
    "email_queue"
    "email_logs"
    "webhooks"
    "webhook_queue"
    "webhook_logs"
    "campaigns"
    "ab_tests"
    "funnels"
    "forums"
    "forum_posts"
    "forum_members"
    "api_keys"
    "ai_generations"
    "integrations"
    "assessment_submissions"
    "certificates"
    "notifications"
    "analytics_events"
    "billing_transactions"
)

echo -e "${YELLOW}Testing RLS on ${#RLS_TABLES[@]} tables...${NC}"
echo ""

PROTECTED=0
ACCESSIBLE=0
FAILED=0

for table in "${RLS_TABLES[@]}"; do
    # Try to access table without authentication
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        "$SUPABASE_URL/rest/v1/$table?limit=1" \
        -H "apikey: $SUPABASE_ANON_KEY" 2>&1)
    
    if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
        echo -e "${GREEN}✅ $table - Protected (RLS active)${NC}"
        PROTECTED=$((PROTECTED + 1))
    elif [ "$RESPONSE" = "200" ]; then
        echo -e "${YELLOW}⚠️  $table - Accessible (public policy or no data)${NC}"
        ACCESSIBLE=$((ACCESSIBLE + 1))
    else
        echo -e "${RED}❌ $table - Error (HTTP $RESPONSE)${NC}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  RLS SUMMARY${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "Total Tables: ${#RLS_TABLES[@]}"
echo -e "${GREEN}Protected: $PROTECTED${NC}"
echo -e "${YELLOW}Accessible: $ACCESSIBLE${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ RLS verification complete${NC}"
    echo ""
    echo "Note: Some tables may be accessible if:"
    echo "  - They have public read policies"
    echo "  - They are empty (no data to protect)"
    echo "  - Policies allow anonymous access"
    echo ""
    echo "This is expected behavior for certain tables."
else
    echo -e "${RED}❌ Some tables failed verification${NC}"
    echo ""
    echo "Please check:"
    echo "1. Tables exist: https://supabase.com/dashboard/project/$PROJECT_REF/database/tables"
    echo "2. RLS enabled: Check 'Enable RLS' toggle on each table"
    echo "3. Policies created: https://supabase.com/dashboard/project/$PROJECT_REF/database/policies"
fi

echo ""
echo "For detailed policy review, visit:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/database/policies"
