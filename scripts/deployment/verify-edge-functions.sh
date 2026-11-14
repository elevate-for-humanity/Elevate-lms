#!/bin/bash

# Edge Functions Verification Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  ⚡ EDGE FUNCTIONS VERIFICATION${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Load environment
export $(grep -v '^#' .env | grep -v '^$' | xargs 2>/dev/null)
PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)

echo "Project: $PROJECT_REF"
echo ""

# Edge Functions to verify
FUNCTIONS=(
    "email-dispatch:Email sending functionality"
    "webhook-dispatch:Webhook processing"
    "ai-course-create:AI course generation"
    "grade-ai:AI grading system"
)

echo -e "${YELLOW}Testing ${#FUNCTIONS[@]} Edge Functions...${NC}"
echo ""

DEPLOYED=0
NOT_DEPLOYED=0

for func_info in "${FUNCTIONS[@]}"; do
    IFS=':' read -r func_name func_desc <<< "$func_info"
    
    # Test if function endpoint exists
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        "$SUPABASE_URL/functions/v1/$func_name" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{}' 2>&1)
    
    # Any response other than 404 means function exists
    if [ "$RESPONSE" != "404" ]; then
        echo -e "${GREEN}✅ $func_name${NC}"
        echo "   Description: $func_desc"
        echo "   Status: Deployed (HTTP $RESPONSE)"
        DEPLOYED=$((DEPLOYED + 1))
    else
        echo -e "${RED}❌ $func_name${NC}"
        echo "   Description: $func_desc"
        echo "   Status: Not deployed (HTTP 404)"
        NOT_DEPLOYED=$((NOT_DEPLOYED + 1))
    fi
    echo ""
done

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  EDGE FUNCTIONS SUMMARY${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "Total Functions: ${#FUNCTIONS[@]}"
echo -e "${GREEN}Deployed: $DEPLOYED${NC}"
echo -e "${RED}Not Deployed: $NOT_DEPLOYED${NC}"
echo ""

if [ $NOT_DEPLOYED -eq 0 ]; then
    echo -e "${GREEN}✅ All Edge Functions deployed!${NC}"
    echo ""
    echo "Test your functions:"
    echo ""
    echo "1. Email Dispatch:"
    echo "   curl -X POST \"$SUPABASE_URL/functions/v1/email-dispatch\" \\"
    echo "     -H \"Authorization: Bearer \$SUPABASE_ANON_KEY\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"to\":\"test@example.com\",\"subject\":\"Test\",\"text\":\"Hello\"}'"
    echo ""
    echo "2. AI Course Create:"
    echo "   curl -X POST \"$SUPABASE_URL/functions/v1/ai-course-create\" \\"
    echo "     -H \"Authorization: Bearer \$SUPABASE_ANON_KEY\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"topic\":\"Python Basics\",\"level\":\"beginner\"}'"
    echo ""
else
    echo -e "${RED}❌ Some Edge Functions are not deployed${NC}"
    echo ""
    echo "To deploy missing functions:"
    echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
    echo "2. Click 'Create a new function'"
    echo "3. Copy code from deployment-ready/*.ts files"
    echo "4. Deploy each function"
    echo ""
    echo "Or use CLI:"
    echo "  npx supabase functions deploy email-dispatch"
    echo "  npx supabase functions deploy webhook-dispatch"
    echo "  npx supabase functions deploy ai-course-create"
    echo "  npx supabase functions deploy grade-ai"
fi

echo ""
echo "View function logs:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/logs/edge-functions"
