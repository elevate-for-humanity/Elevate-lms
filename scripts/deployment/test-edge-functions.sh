#!/bin/bash

# Edge Functions Test Script
# Copyright (c) 2025 Elevate for Humanity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Edge Functions Test Suite${NC}"
echo "=========================="
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

source .env

# Extract project ref
PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)
BASE_URL="https://$PROJECT_REF.supabase.co/functions/v1"

echo -e "${BLUE}Project:${NC} $PROJECT_REF"
echo -e "${BLUE}Base URL:${NC} $BASE_URL"
echo ""

# Check if functions are deployed
echo "Checking deployed functions..."
echo ""

FUNCTIONS=("email-dispatch" "webhook-dispatch" "ai-course-create" "grade-ai")
DEPLOYED=0

for func in "${FUNCTIONS[@]}"; do
    echo -n "Checking $func... "
    
    # Try to call the function (will fail if not deployed)
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$BASE_URL/$func" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null || echo "000")
    
    if [ "$STATUS" != "000" ] && [ "$STATUS" != "404" ]; then
        echo -e "${GREEN}✓ Deployed (HTTP $STATUS)${NC}"
        ((DEPLOYED++))
    else
        echo -e "${RED}✗ Not deployed or not accessible${NC}"
    fi
done

echo ""

if [ $DEPLOYED -eq 0 ]; then
    echo -e "${RED}No Edge Functions are deployed${NC}"
    echo ""
    echo "To deploy functions, run:"
    echo "  ./deploy-edge-functions.sh"
    echo ""
    echo "Or manually:"
    echo "  npx supabase login"
    echo "  npx supabase functions deploy email-dispatch --project-ref $PROJECT_REF"
    exit 1
fi

echo -e "${GREEN}$DEPLOYED of ${#FUNCTIONS[@]} functions are deployed${NC}"
echo ""

# Test email-dispatch
echo -e "${YELLOW}Testing email-dispatch...${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/email-dispatch" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "to": "test@example.com",
        "subject": "Test Email",
        "html": "<p>This is a test email</p>"
    }')

if echo "$RESPONSE" | grep -q "error"; then
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo -e "${YELLOW}Response: $ERROR${NC}"
    echo "This is expected if email provider is not configured"
else
    echo -e "${GREEN}✓ Function responded successfully${NC}"
fi

echo ""

# Test webhook-dispatch
echo -e "${YELLOW}Testing webhook-dispatch...${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/webhook-dispatch" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "event": "test.event",
        "data": {"message": "Hello"},
        "orgId": "test-org-id"
    }')

if echo "$RESPONSE" | grep -q "error"; then
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo -e "${YELLOW}Response: $ERROR${NC}"
else
    echo -e "${GREEN}✓ Function responded successfully${NC}"
fi

echo ""

# Test ai-course-create
echo -e "${YELLOW}Testing ai-course-create...${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/ai-course-create" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "topic": "Test Course",
        "difficulty": "beginner",
        "duration": 1,
        "moduleCount": 1,
        "orgId": "test-org-id",
        "userId": "test-user-id"
    }')

if echo "$RESPONSE" | grep -q "error"; then
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo -e "${YELLOW}Response: $ERROR${NC}"
    echo "This is expected if AI provider is not configured"
else
    echo -e "${GREEN}✓ Function responded successfully${NC}"
fi

echo ""

# Test grade-ai
echo -e "${YELLOW}Testing grade-ai...${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/grade-ai" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "submissionId": "test-submission-id",
        "assessmentId": "test-assessment-id",
        "userId": "test-user-id",
        "orgId": "test-org-id"
    }')

if echo "$RESPONSE" | grep -q "error"; then
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo -e "${YELLOW}Response: $ERROR${NC}"
    echo "This is expected if AI provider is not configured or submission doesn't exist"
else
    echo -e "${GREEN}✓ Function responded successfully${NC}"
fi

echo ""
echo -e "${GREEN}Edge Functions test complete!${NC}"
echo ""
echo -e "${YELLOW}Notes:${NC}"
echo "- Functions returning errors is expected if:"
echo "  • Email/AI providers are not configured"
echo "  • Test data doesn't exist in database"
echo "  • Authentication is required"
echo ""
echo "- To configure providers, run:"
echo "  ./configure-env-vars.sh"
echo ""
echo "- To view function logs:"
echo "  Go to Supabase Dashboard > Edge Functions > Select function > Logs"
