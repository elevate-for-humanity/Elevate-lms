#!/bin/bash
# Production Readiness Check - Comprehensive Test Suite

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🚀 PRODUCTION READINESS CHECK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test function
test_check() {
    local name=$1
    local command=$2
    local type=${3:-"error"}
    
    echo -n "  Testing: $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASS++))
        return 0
    else
        if [ "$type" = "warn" ]; then
            echo -e "${YELLOW}⚠️  WARN${NC}"
            ((WARN++))
        else
            echo -e "${RED}❌ FAIL${NC}"
            ((FAIL++))
        fi
        return 1
    fi
}

echo -e "${BLUE}1. Environment Configuration${NC}"
test_check "Environment file exists" "test -f .env.local"
test_check "Branch-specific env exists" "test -d .env-branches"
test_check "Gitignore configured" "grep -q '.env.local' .gitignore"
echo ""

echo -e "${BLUE}2. PWA Configuration${NC}"
test_check "Canonical Marketing manifest exists" "test -f public/manifest-marketing.json"
test_check "Icon 192 exists" "test -f public/icon-192.png"
test_check "Icon 512 exists" "test -f public/icon-512.png"
test_check "Maskable icons exist" "test -f public/icon-192-maskable.png && test -f public/icon-512-maskable.png"
echo ""

echo -e "${BLUE}3. SEO & Robots${NC}"
test_check "Robots.txt exists" "test -f public/robots.txt"
test_check "Sitemap exists" "test -f public/sitemap.xml"
test_check "Robots blocks AI scrapers" "grep -q 'GPTBot' public/robots.txt"
echo ""

echo -e "${BLUE}4. LMS Courses${NC}"
if node scripts/integrity/lms.mjs; then
    echo -e "  ${GREEN}✅ Persisted course authority verified${NC}"
    ((PASS++))
else
    echo -e "  ${RED}❌ Persisted course authority verification failed${NC}"
    ((FAIL++))
fi
echo ""

echo -e "${BLUE}5. Code Quality${NC}"
test_check "No console.log in API routes" "! grep -r 'console\.log' app/api --include='*.ts' --include='*.tsx'" "warn"
test_check "No TODO in critical files" "! grep -r 'TODO.*email' app/api --include='*.ts'" "warn"
test_check "No placeholder data" "! grep -r 'XXXXXXXXXX' components --include='*.jsx' --include='*.tsx'" "warn"
echo ""

echo -e "${BLUE}6. Navigation & Routes${NC}"
test_check "Micro courses in header" "grep -q 'micro-classes' components/site/SiteHeader.tsx"
test_check "Micro courses page exists" "test -f app/micro-classes/page.tsx"
test_check "Programs page exists" "test -f app/programs/page.tsx"
echo ""

echo -e "${BLUE}7. Email Integration${NC}"
test_check "Resend library exists" "test -f lib/email/resend.ts"
test_check "Welcome email function" "grep -q 'sendWelcomeEmail' lib/email/resend.ts"
test_check "Creator approval email" "grep -q 'sendCreatorApprovalEmail' lib/email/resend.ts"
test_check "Payout email function" "grep -q 'sendPayoutConfirmationEmail' lib/email/resend.ts"
echo ""

echo -e "${BLUE}8. Security${NC}"
test_check "Admin role check exists" "grep -q 'role.*admin' app/api/admin/creators/reject/route.ts"
test_check "Security headers configured" "grep -q 'X-Frame-Options' next.config.mjs"
test_check "CSP configured" "grep -q 'Content-Security-Policy' next.config.mjs"
echo ""

echo -e "${BLUE}9. Dependencies${NC}"
test_check "Node modules installed" "test -d node_modules"
test_check "Package lock exists" "test -f package-lock.json"
test_check "Resend installed" "grep -q '\"resend\"' package.json"
echo ""

echo -e "${BLUE}10. TypeScript Configuration${NC}"
test_check "TypeScript config exists" "test -f tsconfig.json"
test_check "Build errors not ignored" "grep -q 'ignoreBuildErrors: false' next.config.mjs"
echo ""

# Try to build
echo -e "${BLUE}11. Build Test${NC}"
echo "  Running Next.js build (this may take a few minutes)..."
if NODE_OPTIONS=--max-old-space-size=4096 pnpm build > /tmp/build.log 2>&1; then
    echo -e "  ${GREEN}✅ Build successful${NC}"
    ((PASS++))
else
    echo -e "  ${RED}❌ Build failed${NC}"
    echo "  Check /tmp/build.log for details"
    tail -20 /tmp/build.log
    ((FAIL++))
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📊 TEST SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}✅ Passed: $PASS${NC}"
echo -e "  ${YELLOW}⚠️  Warnings: $WARN${NC}"
echo -e "  ${RED}❌ Failed: $FAIL${NC}"
echo ""

TOTAL=$((PASS + WARN + FAIL))
SCORE=$((PASS * 100 / TOTAL))

echo -e "  ${BLUE}Score: $SCORE%${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   🎉 PRODUCTION READY!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Fill in API keys in .env.local"
    echo "  2. Deploy to production"
    echo "  3. Monitor error logs"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   ⚠️  NOT PRODUCTION READY${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Please fix the failed checks above${NC}"
    echo ""
    exit 1
fi
