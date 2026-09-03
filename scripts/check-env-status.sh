#!/bin/bash
# Check Environment Variable Status

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🔍 ENVIRONMENT VARIABLE STATUS CHECK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env.local exists${NC}"
echo ""

# Function to check variable
check_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env.local | cut -d'=' -f2-)
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ ${var_name}: NOT SET${NC}"
        return 1
    elif [[ "$var_value" == *"GET_FROM"* ]] || [[ "$var_value" == *"YOUR_"* ]] || [[ "$var_value" == *"XXXXXXXXXX"* ]] || [[ "$var_value" == *'$('* ]]; then
        echo -e "${YELLOW}⚠️  ${var_name}: PLACEHOLDER${NC}"
        echo -e "   Value: ${var_value}"
        return 2
    else
        echo -e "${GREEN}✅ ${var_name}: SET${NC}"
        # Show first 20 chars
        local preview="${var_value:0:20}"
        if [ ${#var_value} -gt 20 ]; then
            preview="${preview}..."
        fi
        echo -e "   Preview: ${preview}"
        return 0
    fi
}

echo -e "${BLUE}━━━ CRITICAL VARIABLES (Required for Build) ━━━${NC}"
echo ""

CRITICAL_MISSING=0
CRITICAL_PLACEHOLDER=0

check_var "NEXT_PUBLIC_SUPABASE_URL"
result=$?
[ $result -eq 1 ] && ((CRITICAL_MISSING++))
[ $result -eq 2 ] && ((CRITICAL_PLACEHOLDER++))

check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
result=$?
[ $result -eq 1 ] && ((CRITICAL_MISSING++))
[ $result -eq 2 ] && ((CRITICAL_PLACEHOLDER++))

check_var "SUPABASE_SERVICE_ROLE_KEY"
result=$?
[ $result -eq 1 ] && ((CRITICAL_MISSING++))
[ $result -eq 2 ] && ((CRITICAL_PLACEHOLDER++))

echo ""
echo -e "${BLUE}━━━ IMPORTANT VARIABLES (For Full Functionality) ━━━${NC}"
echo ""

IMPORTANT_MISSING=0
IMPORTANT_PLACEHOLDER=0

check_var "RESEND_API_KEY"
result=$?
[ $result -eq 1 ] && ((IMPORTANT_MISSING++))
[ $result -eq 2 ] && ((IMPORTANT_PLACEHOLDER++))

check_var "STRIPE_SECRET_KEY"
result=$?
[ $result -eq 1 ] && ((IMPORTANT_MISSING++))
[ $result -eq 2 ] && ((IMPORTANT_PLACEHOLDER++))

check_var "NEXTAUTH_SECRET"
result=$?
[ $result -eq 1 ] && ((IMPORTANT_MISSING++))
[ $result -eq 2 ] && ((IMPORTANT_PLACEHOLDER++))

check_var "OPENAI_API_KEY"
result=$?
[ $result -eq 1 ] && ((IMPORTANT_MISSING++))
[ $result -eq 2 ] && ((IMPORTANT_PLACEHOLDER++))

check_var "NEXT_PUBLIC_GA_MEASUREMENT_ID"
result=$?
[ $result -eq 1 ] && ((IMPORTANT_MISSING++))
[ $result -eq 2 ] && ((IMPORTANT_PLACEHOLDER++))

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📊 SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "Critical Variables:"
echo -e "  Missing: ${CRITICAL_MISSING}"
echo -e "  Placeholder: ${CRITICAL_PLACEHOLDER}"
echo ""

echo -e "Important Variables:"
echo -e "  Missing: ${IMPORTANT_MISSING}"
echo -e "  Placeholder: ${IMPORTANT_PLACEHOLDER}"
echo ""

# Overall status
if [ $CRITICAL_MISSING -gt 0 ] || [ $CRITICAL_PLACEHOLDER -gt 0 ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   ❌ CRITICAL ISSUES FOUND${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}🔧 HOW TO FIX:${NC}"
    echo ""
    echo "1. Get Supabase keys from:"
    echo "   https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/settings/api"
    echo ""
    echo "2. Edit .env.local:"
    echo "   nano .env.local"
    echo ""
    echo "3. Replace placeholders with real values:"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc..."
    echo "   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc..."
    echo ""
    echo "4. Generate NEXTAUTH_SECRET:"
    echo "   openssl rand -base64 32"
    echo ""
    echo "5. Re-run this check:"
    echo "   bash scripts/check-env-status.sh"
    echo ""
    exit 1
else
    if [ $IMPORTANT_MISSING -gt 0 ] || [ $IMPORTANT_PLACEHOLDER -gt 0 ]; then
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}   ⚠️  PARTIAL CONFIGURATION${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Critical variables are set, but some features won't work:"
        echo ""
        [ $IMPORTANT_PLACEHOLDER -gt 0 ] && echo "  - Email notifications (RESEND_API_KEY)"
        [ $IMPORTANT_PLACEHOLDER -gt 0 ] && echo "  - Payments (STRIPE_SECRET_KEY)"
        [ $IMPORTANT_PLACEHOLDER -gt 0 ] && echo "  - AI features (OPENAI_API_KEY)"
        [ $IMPORTANT_PLACEHOLDER -gt 0 ] && echo "  - Analytics (GA_MEASUREMENT_ID)"
        echo ""
        echo "You can build and run, but add these for full functionality."
        echo ""
        exit 0
    else
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}   ✅ ALL VARIABLES CONFIGURED${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Your environment is fully configured!"
        echo ""
        echo "Next steps:"
        echo "  1. pnpm install"
        echo "  2. pnpm build"
        echo "  3. pnpm start"
        echo ""
        exit 0
    fi
fi
