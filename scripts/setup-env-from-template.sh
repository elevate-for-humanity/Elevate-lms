#!/bin/bash
# Setup .env.local from complete template with all known values

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🚀 SETUP ENVIRONMENT FROM TEMPLATE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if template exists
if [ ! -f .env.template.complete ]; then
    echo -e "${RED}❌ .env.template.complete not found${NC}"
    exit 1
fi

# Backup existing .env.local
if [ -f .env.local ]; then
    BACKUP=".env.local.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env.local "$BACKUP"
    echo -e "${GREEN}📦 Backed up existing .env.local to:${NC}"
    echo -e "   $BACKUP"
    echo ""
fi

# Copy template to .env.local
cp .env.template.complete .env.local

echo -e "${GREEN}✅ Created .env.local from template${NC}"
echo ""

# Count variables
TOTAL=$(grep -c "^[A-Z_]*=" .env.local)
REAL=$(grep "^[A-Z_]*=" .env.local | grep -vE "=(your_|GET_FROM|XXXXXXXXXX|\.\.\.)" | wc -l)
PLACEHOLDER=$((TOTAL - REAL))

echo -e "${BLUE}📊 Environment Status:${NC}"
echo -e "  Total variables: ${TOTAL}"
echo -e "  ✅ Real values: ${REAL}"
echo -e "  ⚠️  Placeholders: ${PLACEHOLDER}"
echo ""

# Check critical variables
echo -e "${BLUE}🔍 Critical Variables Check:${NC}"
echo ""

check_var() {
    local key=$1
    local desc=$2
    local value=$(grep "^${key}=" .env.local | cut -d'=' -f2-)
    
    if [ -z "$value" ]; then
        echo -e "  ❌ ${desc}: EMPTY"
        return 1
    elif [[ "$value" =~ (GET_FROM|YOUR_|XXXXXXXXXX|your_.*_here|\.\.\.|\<|\>) ]]; then
        echo -e "  ⚠️  ${desc}: PLACEHOLDER"
        return 2
    elif [ ${#value} -lt 30 ]; then
        echo -e "  ⚠️  ${desc}: TRUNCATED (${#value} chars)"
        return 2
    else
        echo -e "  ✅ ${desc}: SET"
        return 0
    fi
}

CRITICAL_MISSING=0
CRITICAL_PLACEHOLDER=0

check_var "NEXT_PUBLIC_SUPABASE_URL" "Supabase URL"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anon Key"
result=$?
[ $result -eq 1 ] && ((CRITICAL_MISSING++))
[ $result -eq 2 ] && ((CRITICAL_PLACEHOLDER++))

check_var "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Key"
result=$?
[ $result -eq 1 ] && ((CRITICAL_MISSING++))
[ $result -eq 2 ] && ((CRITICAL_PLACEHOLDER++))

check_var "NEXTAUTH_SECRET" "NextAuth Secret"
check_var "RESEND_API_KEY" "Resend API Key"
check_var "STRIPE_SECRET_KEY" "Stripe Secret Key"
check_var "OPENAI_API_KEY" "OpenAI API Key"
check_var "NEXT_PUBLIC_GA_MEASUREMENT_ID" "Google Analytics ID"

echo ""

if [ $CRITICAL_MISSING -gt 0 ] || [ $CRITICAL_PLACEHOLDER -gt 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}   ⚠️  ACTION REQUIRED${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Supabase keys are truncated. Get full keys from:${NC}"
    echo ""
    echo -e "  ${GREEN}Option 1: Supabase Dashboard${NC}"
    echo -e "  https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/settings/api"
    echo ""
    echo -e "  ${GREEN}Option 2: Vercel CLI${NC}"
    echo -e "  vercel env pull .env.local"
    echo ""
    echo -e "  ${GREEN}Option 3: Vercel Dashboard${NC}"
    echo -e "  https://vercel.com/elevateforhumanity/fix2/settings/environment-variables"
    echo ""
    echo -e "${BLUE}Then edit .env.local and replace truncated keys${NC}"
    echo ""
else
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✅ ALL CRITICAL VARIABLES SET${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. pnpm install"
    echo "  2. pnpm build"
    echo "  3. pnpm start"
    echo ""
fi
