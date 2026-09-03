#!/bin/bash

# Pre-Launch Automated Tests
# Run this script before deploying to production

echo "🚀 ELEVATE FOR HUMANITY - PRE-LAUNCH TESTS"
echo "=========================================="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

echo "1. CHECKING FILE STRUCTURE"
echo "----------------------------"

# Check critical files exist
if [ -f "package.json" ]; then
    pass "package.json exists"
else
    fail "package.json missing"
fi

if [ -f "next.config.mjs" ]; then
    pass "next.config.mjs exists"
else
    fail "next.config.mjs missing"
fi

if [ -f ".env.example" ]; then
    pass ".env.example exists"
else
    warn ".env.example missing"
fi

if [ -f ".gitignore" ]; then
    pass ".gitignore exists"
else
    fail ".gitignore missing"
fi

echo ""
echo "2. CHECKING DEPENDENCIES"
echo "-------------------------"

# Check for node_modules
if [ -d "node_modules" ]; then
    pass "node_modules installed"
else
    fail "node_modules not installed - run pnpm install"
fi

# Check for security vulnerabilities
echo "Running security audit..."
if pnpm audit --prod 2>&1 | grep -q "0 vulnerabilities"; then
    pass "No security vulnerabilities found"
else
    warn "Security vulnerabilities detected - review pnpm audit output"
fi

echo ""
echo "3. CHECKING CODE QUALITY"
echo "-------------------------"

# Check TypeScript compilation
echo "Checking TypeScript..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    warn "TypeScript errors found"
else
    pass "TypeScript compilation clean"
fi

# Check for console.logs in production code
CONSOLE_LOGS=$(find app -name "*.tsx" -o -name "*.ts" | xargs grep -n "console.log" | wc -l)
if [ $CONSOLE_LOGS -gt 50 ]; then
    warn "Found $CONSOLE_LOGS console.log statements - consider removing for production"
else
    pass "Console.log usage acceptable ($CONSOLE_LOGS found)"
fi

echo ""
echo "4. CHECKING ENVIRONMENT VARIABLES"
echo "-----------------------------------"

# Check for required env vars in .env.example
REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "STRIPE_SECRET_KEY" "STRIPE_WEBHOOK_SECRET")

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "$var" .env.example; then
        pass "$var documented in .env.example"
    else
        warn "$var not in .env.example"
    fi
done

echo ""
echo "5. CHECKING CRITICAL PAGES"
echo "---------------------------"

# Check critical pages exist
CRITICAL_PAGES=("app/page.tsx" "app/about/page.tsx" "app/contact/page.tsx" "app/programs/page.tsx" "app/apply/page.tsx")

for page in "${CRITICAL_PAGES[@]}"; do
    if [ -f "$page" ]; then
        LINES=$(wc -l < "$page")
        if [ $LINES -gt 50 ]; then
            pass "$(basename $(dirname $page))/page.tsx exists ($LINES lines)"
        else
            warn "$(basename $(dirname $page))/page.tsx exists but may be incomplete ($LINES lines)"
        fi
    else
        fail "$page missing"
    fi
done

echo ""
echo "6. CHECKING API ENDPOINTS"
echo "--------------------------"

# Count API endpoints
API_COUNT=$(find app/api -name "route.ts" | wc -l)
if [ $API_COUNT -gt 100 ]; then
    pass "Found $API_COUNT API endpoints"
else
    warn "Only $API_COUNT API endpoints found"
fi

# Check critical API endpoints
CRITICAL_APIS=("app/api/applications/route.ts" "app/api/stripe/webhook/route.ts" "app/api/email/send/route.ts")

for api in "${CRITICAL_APIS[@]}"; do
    if [ -f "$api" ]; then
        pass "$(echo $api | sed 's|app/api/||' | sed 's|/route.ts||') endpoint exists"
    else
        fail "$api missing"
    fi
done

echo ""
echo "7. CHECKING DATABASE MIGRATIONS"
echo "--------------------------------"

MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" | wc -l)
if [ $MIGRATION_COUNT -gt 50 ]; then
    pass "Found $MIGRATION_COUNT database migrations"
else
    warn "Only $MIGRATION_COUNT migrations found"
fi

echo ""
echo "8. CHECKING SECURITY"
echo "---------------------"

# Check for exposed secrets
if grep -r "sk_live_" app/ 2>/dev/null | grep -v ".env"; then
    fail "Live Stripe key found in code!"
else
    pass "No exposed Stripe live keys"
fi

if grep -r "password.*=.*['\"]" app/ 2>/dev/null | grep -v "type=\|placeholder=\|label="; then
    warn "Possible hardcoded passwords found"
else
    pass "No obvious hardcoded passwords"
fi

# Check .gitignore includes critical patterns
if grep -q "node_modules" .gitignore && grep -q ".env" .gitignore; then
    pass ".gitignore includes critical patterns"
else
    fail ".gitignore missing critical patterns"
fi

echo ""
echo "9. CHECKING BUILD"
echo "------------------"

# Try to build
echo "Attempting production build (this may take a few minutes)..."
if pnpm build > /tmp/build.log 2>&1; then
    pass "Production build successful"
else
    fail "Production build failed - check /tmp/build.log"
    tail -20 /tmp/build.log
fi

echo ""
echo "10. CHECKING PERFORMANCE"
echo "-------------------------"

# Check bundle size
if [ -d ".next" ]; then
    BUNDLE_SIZE=$(du -sh .next | cut -f1)
    pass "Build size: $BUNDLE_SIZE"
else
    warn "No build directory found"
fi

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CRITICAL TESTS PASSED${NC}"
    echo "Review warnings before deploying to production"
    exit 0
else
    echo -e "${RED}❌ CRITICAL TESTS FAILED${NC}"
    echo "Fix failed tests before deploying to production"
    exit 1
fi
