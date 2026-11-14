#!/usr/bin/env bash
set -e

echo ""
echo "==================================================================="
echo "🏥 PRE-LAUNCH HEALTH CHECK - Professional Development Standards"
echo "==================================================================="
echo ""

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

REPORT="PRE_LAUNCH_HEALTH_CHECK.md"
PASS=0
FAIL=0
WARN=0

echo "# PRE-LAUNCH HEALTH CHECK REPORT" > "$REPORT"
echo "**Generated:** $(date)" >> "$REPORT"
echo "**Site:** www.elevateforhumanity.org" >> "$REPORT"
echo "" >> "$REPORT"

# Helper functions
check_pass() {
    echo "  ✅ $1" | tee -a "$REPORT"
    ((PASS++))
}

check_fail() {
    echo "  ❌ $1" | tee -a "$REPORT"
    ((FAIL++))
}

check_warn() {
    echo "  ⚠️  $1" | tee -a "$REPORT"
    ((WARN++))
}

echo "## 1. BUILD & COMPILATION" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check if build succeeds
echo "Checking build..." | tee -a "$REPORT"
if npm run build > /dev/null 2>&1 || pnpm build > /dev/null 2>&1; then
    check_pass "Build succeeds without errors"
else
    check_fail "Build fails - CRITICAL"
fi

# Check TypeScript
echo "Checking TypeScript..." | tee -a "$REPORT"
if npx tsc --noEmit > /dev/null 2>&1; then
    check_pass "No TypeScript errors"
else
    check_warn "TypeScript errors found"
fi

# Check ESLint
echo "Checking ESLint..." | tee -a "$REPORT"
if npx eslint . --ext .ts,.tsx > /dev/null 2>&1; then
    check_pass "No ESLint errors"
else
    check_warn "ESLint errors found"
fi

echo "" >> "$REPORT"

echo "## 2. ENVIRONMENT VARIABLES" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check critical env vars
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "STRIPE_SECRET_KEY"
    "NEXT_PUBLIC_SITE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ ! -z "${!var}" ]; then
        check_pass "$var is set"
    else
        check_fail "$var is MISSING - CRITICAL"
    fi
done

echo "" >> "$REPORT"

echo "## 3. DATABASE CONNECTIVITY" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check if Supabase is reachable
if curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" > /dev/null 2>&1; then
    check_pass "Supabase database is reachable"
else
    check_fail "Cannot reach Supabase - CRITICAL"
fi

echo "" >> "$REPORT"

echo "## 4. API ROUTES" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Count API routes
API_COUNT=$(find app/api -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
echo "  Found $API_COUNT API routes" | tee -a "$REPORT"

# Check for common API errors
if grep -r "TODO\|FIXME\|XXX" app/api --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
    check_warn "API routes contain TODO/FIXME comments"
else
    check_pass "No TODO comments in API routes"
fi

echo "" >> "$REPORT"

echo "## 5. AUTHENTICATION & SECURITY" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for hardcoded secrets
if grep -r "sk_live\|pk_live\|password.*=.*['\"]" app --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
    check_fail "Hardcoded secrets found - CRITICAL SECURITY ISSUE"
else
    check_pass "No hardcoded secrets detected"
fi

# Check for console.log in production
CONSOLE_LOGS=$(grep -r "console.log\|console.error" app --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 50 ]; then
    check_warn "Found $CONSOLE_LOGS console statements - should remove for production"
else
    check_pass "Minimal console statements ($CONSOLE_LOGS)"
fi

# Check middleware exists
if [ -f "middleware.ts" ]; then
    check_pass "Middleware file exists"
else
    check_fail "Middleware file missing"
fi

# Check for rate limiting
if grep -q "rate.*limit\|rateLimit" middleware.ts 2>/dev/null; then
    check_pass "Rate limiting implemented"
else
    check_warn "Rate limiting not found in middleware"
fi

echo "" >> "$REPORT"

echo "## 6. PAGES & ROUTING" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Count pages
TOTAL_PAGES=$(find app -name "page.tsx" -o -name "page.ts" 2>/dev/null | wc -l)
echo "  Total pages: $TOTAL_PAGES" | tee -a "$REPORT"

# Check for pages without metadata
PAGES_NO_META=$(find app -name "page.tsx" -not -path "*/api/*" 2>/dev/null | while read page; do
    if ! grep -q "metadata\|Metadata" "$page" 2>/dev/null; then
        echo "$page"
    fi
done | wc -l)

if [ "$PAGES_NO_META" -eq 0 ]; then
    check_pass "All pages have metadata"
elif [ "$PAGES_NO_META" -lt 10 ]; then
    check_warn "$PAGES_NO_META pages missing metadata"
else
    check_fail "$PAGES_NO_META pages missing metadata - SEO ISSUE"
fi

# Check for 404 page
if [ -f "app/not-found.tsx" ]; then
    check_pass "Custom 404 page exists"
else
    check_warn "No custom 404 page"
fi

# Check for error page
if [ -f "app/error.tsx" ]; then
    check_pass "Custom error page exists"
else
    check_warn "No custom error page"
fi

echo "" >> "$REPORT"

echo "## 7. IMAGES & MEDIA" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for external images
EXTERNAL_IMAGES=$(grep -r "https://images.unsplash\|https://via.placeholder\|https://picsum" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$EXTERNAL_IMAGES" -eq 0 ]; then
    check_pass "No external image dependencies"
else
    check_fail "$EXTERNAL_IMAGES external image URLs found - should use local images"
fi

# Check for missing alt text
IMAGES_NO_ALT=$(grep -r "<Image\|<img" app --include="*.tsx" 2>/dev/null | grep -v "alt=" | wc -l)
if [ "$IMAGES_NO_ALT" -eq 0 ]; then
    check_pass "All images have alt text"
elif [ "$IMAGES_NO_ALT" -lt 20 ]; then
    check_warn "$IMAGES_NO_ALT images missing alt text"
else
    check_fail "$IMAGES_NO_ALT images missing alt text - ACCESSIBILITY ISSUE"
fi

# Check for unoptimized images
UNOPTIMIZED=$(grep -r "<img" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$UNOPTIMIZED" -eq 0 ]; then
    check_pass "All images use Next.js Image component"
elif [ "$UNOPTIMIZED" -lt 10 ]; then
    check_warn "$UNOPTIMIZED unoptimized <img> tags"
else
    check_fail "$UNOPTIMIZED unoptimized <img> tags - PERFORMANCE ISSUE"
fi

echo "" >> "$REPORT"

echo "## 8. SEO & META TAGS" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for sitemap
if [ -f "public/sitemap.xml" ] || grep -q "sitemap" app --include="*.ts" 2>/dev/null; then
    check_pass "Sitemap exists or is generated"
else
    check_warn "No sitemap found"
fi

# Check for robots.txt
if [ -f "public/robots.txt" ]; then
    check_pass "robots.txt exists"
else
    check_fail "robots.txt missing - SEO ISSUE"
fi

# Check for OpenGraph images
OG_IMAGES=$(grep -r "og:image\|twitter:image" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$OG_IMAGES" -gt 10 ]; then
    check_pass "OpenGraph images configured"
else
    check_warn "Few OpenGraph images found - social sharing may look poor"
fi

echo "" >> "$REPORT"

echo "## 9. PERFORMANCE" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for dynamic imports
DYNAMIC_IMPORTS=$(grep -r "dynamic.*import\|lazy" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$DYNAMIC_IMPORTS" -gt 5 ]; then
    check_pass "Code splitting implemented ($DYNAMIC_IMPORTS dynamic imports)"
else
    check_warn "Limited code splitting - consider lazy loading"
fi

# Check for large dependencies
if [ -f "package.json" ]; then
    DEPS=$(cat package.json | grep -c "\".*\":" || echo 0)
    if [ "$DEPS" -lt 100 ]; then
        check_pass "Reasonable dependency count ($DEPS)"
    else
        check_warn "Large dependency count ($DEPS) - may impact bundle size"
    fi
fi

echo "" >> "$REPORT"

echo "## 10. ACCESSIBILITY (WCAG)" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for semantic HTML
SEMANTIC=$(grep -r "<main\|<nav\|<header\|<footer\|<article\|<section" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$SEMANTIC" -gt 50 ]; then
    check_pass "Semantic HTML used throughout"
else
    check_warn "Limited semantic HTML - accessibility concern"
fi

# Check for ARIA labels
ARIA=$(grep -r "aria-label\|aria-describedby\|role=" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$ARIA" -gt 20 ]; then
    check_pass "ARIA attributes used"
else
    check_warn "Limited ARIA attributes - may need more for accessibility"
fi

# Check for keyboard navigation
KEYBOARD=$(grep -r "onKeyDown\|onKeyPress\|tabIndex" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$KEYBOARD" -gt 10 ]; then
    check_pass "Keyboard navigation implemented"
else
    check_warn "Limited keyboard navigation support"
fi

echo "" >> "$REPORT"

echo "## 11. MOBILE RESPONSIVENESS" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for responsive classes
RESPONSIVE=$(grep -r "sm:\|md:\|lg:\|xl:\|2xl:" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$RESPONSIVE" -gt 100 ]; then
    check_pass "Extensive responsive design ($RESPONSIVE responsive classes)"
elif [ "$RESPONSIVE" -gt 50 ]; then
    check_warn "Some responsive design - may need more"
else
    check_fail "Limited responsive design - MOBILE ISSUE"
fi

# Check for viewport meta tag
if grep -r "viewport" app --include="*.tsx" 2>/dev/null | grep -q "width=device-width"; then
    check_pass "Viewport meta tag configured"
else
    check_warn "Viewport meta tag not found"
fi

echo "" >> "$REPORT"

echo "## 12. FORMS & VALIDATION" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Count forms
FORMS=$(grep -r "<form\|<Form" app --include="*.tsx" 2>/dev/null | wc -l)
echo "  Found $FORMS forms" | tee -a "$REPORT"

# Check for validation
VALIDATION=$(grep -r "required\|pattern=\|minLength\|maxLength\|validate" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$VALIDATION" -gt 20 ]; then
    check_pass "Form validation implemented"
else
    check_warn "Limited form validation found"
fi

# Check for error handling
ERROR_HANDLING=$(grep -r "error\|Error\|catch" app --include="*.tsx" 2>/dev/null | wc -l)
if [ "$ERROR_HANDLING" -gt 50 ]; then
    check_pass "Error handling implemented"
else
    check_warn "Limited error handling"
fi

echo "" >> "$REPORT"

echo "## 13. ANALYTICS & TRACKING" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for analytics
if grep -r "gtag\|analytics\|GA_MEASUREMENT_ID" app --include="*.tsx" 2>/dev/null > /dev/null; then
    check_pass "Analytics tracking configured"
else
    check_warn "No analytics tracking found"
fi

# Check for conversion tracking
if grep -r "conversion\|event.*track\|gtag.*event" app --include="*.tsx" 2>/dev/null > /dev/null; then
    check_pass "Conversion tracking implemented"
else
    check_warn "No conversion tracking found"
fi

echo "" >> "$REPORT"

echo "## 14. LEGAL & COMPLIANCE" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for privacy policy
if [ -f "app/privacy-policy/page.tsx" ] || [ -f "app/privacy/page.tsx" ]; then
    check_pass "Privacy policy page exists"
else
    check_fail "Privacy policy missing - LEGAL REQUIREMENT"
fi

# Check for terms of service
if [ -f "app/terms-of-service/page.tsx" ] || [ -f "app/terms/page.tsx" ]; then
    check_pass "Terms of service page exists"
else
    check_fail "Terms of service missing - LEGAL REQUIREMENT"
fi

# Check for cookie policy
if [ -f "app/cookies/page.tsx" ] || grep -r "cookie.*policy" app --include="*.tsx" 2>/dev/null > /dev/null; then
    check_pass "Cookie policy exists"
else
    check_warn "Cookie policy not found - may be required for GDPR"
fi

# Check for DMCA
if [ -f "app/dmca/page.tsx" ]; then
    check_pass "DMCA policy exists"
else
    check_warn "DMCA policy not found"
fi

echo "" >> "$REPORT"

echo "## 15. SECURITY HEADERS" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for security headers in middleware
if grep -q "X-Frame-Options\|X-Content-Type-Options\|Referrer-Policy" middleware.ts 2>/dev/null; then
    check_pass "Security headers configured"
else
    check_warn "Security headers not found in middleware"
fi

# Check for CSP
if grep -q "Content-Security-Policy\|CSP" middleware.ts next.config.js 2>/dev/null; then
    check_pass "Content Security Policy configured"
else
    check_warn "No Content Security Policy found"
fi

echo "" >> "$REPORT"

echo "## 16. ERROR HANDLING & LOGGING" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for error boundaries
if grep -r "ErrorBoundary\|componentDidCatch" app --include="*.tsx" 2>/dev/null > /dev/null; then
    check_pass "Error boundaries implemented"
else
    check_warn "No error boundaries found"
fi

# Check for logging
if grep -r "winston\|pino\|logger" app lib --include="*.ts" 2>/dev/null > /dev/null; then
    check_pass "Logging system configured"
else
    check_warn "No logging system found"
fi

echo "" >> "$REPORT"

echo "## 17. TESTING" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for test files
TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" 2>/dev/null | wc -l)
if [ "$TEST_FILES" -gt 10 ]; then
    check_pass "Test files exist ($TEST_FILES tests)"
elif [ "$TEST_FILES" -gt 0 ]; then
    check_warn "Limited test coverage ($TEST_FILES tests)"
else
    check_warn "No test files found"
fi

echo "" >> "$REPORT"

echo "## 18. DOCUMENTATION" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for README
if [ -f "README.md" ]; then
    check_pass "README.md exists"
else
    check_warn "README.md missing"
fi

# Check for API documentation
if [ -f "API.md" ] || [ -d "docs/api" ]; then
    check_pass "API documentation exists"
else
    check_warn "No API documentation found"
fi

echo "" >> "$REPORT"

echo "## 19. DEPLOYMENT CONFIGURATION" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for vercel.json or next.config
if [ -f "vercel.json" ] || [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
    check_pass "Deployment configuration exists"
else
    check_warn "No deployment configuration found"
fi

# Check for .env.example
if [ -f ".env.example" ] || [ -f ".env.template" ]; then
    check_pass "Environment variable template exists"
else
    check_warn ".env.example missing - helpful for deployment"
fi

echo "" >> "$REPORT"

echo "## 20. BACKUP & RECOVERY" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for database migrations
MIGRATIONS=$(find . -path "*/migrations/*.sql" 2>/dev/null | wc -l)
if [ "$MIGRATIONS" -gt 0 ]; then
    check_pass "Database migrations exist ($MIGRATIONS migrations)"
else
    check_warn "No database migrations found"
fi

echo "" >> "$REPORT"

echo "## 21. CONTENT QUALITY" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for placeholder content
PLACEHOLDERS=$(grep -ri "lorem\|ipsum\|placeholder text\|coming soon\|under construction" app --include="*.tsx" 2>/dev/null | grep -v "placeholder=" | wc -l)
if [ "$PLACEHOLDERS" -eq 0 ]; then
    check_pass "No placeholder content found"
elif [ "$PLACEHOLDERS" -lt 5 ]; then
    check_warn "$PLACEHOLDERS instances of placeholder content"
else
    check_fail "$PLACEHOLDERS instances of placeholder content - CONTENT ISSUE"
fi

echo "" >> "$REPORT"

echo "## 22. COMPONENTS" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

COMPONENTS=$(find components -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
echo "  Total components: $COMPONENTS" | tee -a "$REPORT"

# Check for component documentation
DOCUMENTED=$(find components -name "*.md" 2>/dev/null | wc -l)
if [ "$DOCUMENTED" -gt 10 ]; then
    check_pass "Components are documented"
else
    check_warn "Limited component documentation"
fi

echo "" >> "$REPORT"

echo "## 23. PERFORMANCE BUDGET" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check bundle size (if .next exists)
if [ -d ".next" ]; then
    BUNDLE_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo "  Build size: $BUNDLE_SIZE" | tee -a "$REPORT"
    check_pass "Build completed successfully"
else
    check_warn "No build directory found - run 'npm run build' first"
fi

echo "" >> "$REPORT"

echo "## 24. THIRD-PARTY INTEGRATIONS" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for Stripe
if grep -r "stripe" app --include="*.tsx" --include="*.ts" 2>/dev/null > /dev/null; then
    check_pass "Stripe integration configured"
fi

# Check for Supabase
if grep -r "supabase" app --include="*.tsx" --include="*.ts" 2>/dev/null > /dev/null; then
    check_pass "Supabase integration configured"
fi

echo "" >> "$REPORT"

echo "## 25. FINAL CHECKS" >> "$REPORT"
echo "-----------------------------------" | tee -a "$REPORT"

# Check for git repository
if [ -d ".git" ]; then
    check_pass "Git repository initialized"
else
    check_warn "Not a git repository"
fi

# Check for .gitignore
if [ -f ".gitignore" ]; then
    check_pass ".gitignore exists"
else
    check_fail ".gitignore missing - CRITICAL"
fi

# Check for node_modules in git
if git check-ignore node_modules > /dev/null 2>&1; then
    check_pass "node_modules properly ignored"
else
    check_warn "node_modules may not be ignored"
fi

echo "" >> "$REPORT"
echo "==================================================================" >> "$REPORT"
echo "## SUMMARY" >> "$REPORT"
echo "==================================================================" >> "$REPORT"
echo "" >> "$REPORT"
echo "**Total Checks:** $((PASS + FAIL + WARN))" >> "$REPORT"
echo "**✅ Passed:** $PASS" >> "$REPORT"
echo "**❌ Failed:** $FAIL" >> "$REPORT"
echo "**⚠️  Warnings:** $WARN" >> "$REPORT"
echo "" >> "$REPORT"

# Calculate score
TOTAL=$((PASS + FAIL + WARN))
SCORE=$((PASS * 100 / TOTAL))

echo "**HEALTH SCORE:** $SCORE%" >> "$REPORT"
echo "" >> "$REPORT"

if [ "$SCORE" -ge 95 ]; then
    echo "🎉 **STATUS: EXCELLENT** - Ready for production launch!" >> "$REPORT"
elif [ "$SCORE" -ge 85 ]; then
    echo "✅ **STATUS: GOOD** - Minor issues to address before launch" >> "$REPORT"
elif [ "$SCORE" -ge 70 ]; then
    echo "⚠️  **STATUS: FAIR** - Several issues must be fixed before launch" >> "$REPORT"
else
    echo "❌ **STATUS: NOT READY** - Critical issues must be resolved" >> "$REPORT"
fi

echo "" >> "$REPORT"
echo "**Critical Issues (Must Fix):** $FAIL" >> "$REPORT"
echo "**Warnings (Should Fix):** $WARN" >> "$REPORT"
echo "" >> "$REPORT"
echo "---" >> "$REPORT"
echo "**Generated:** $(date)" >> "$REPORT"
echo "**Next Check:** Before production deployment" >> "$REPORT"

echo ""
echo "==================================================================="
echo "HEALTH CHECK COMPLETE"
echo "==================================================================="
echo ""
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo "⚠️  Warnings: $WARN"
echo ""
echo "Health Score: $SCORE%"
echo ""
echo "📄 Full report saved to: $REPORT"
echo ""

cat "$REPORT"
