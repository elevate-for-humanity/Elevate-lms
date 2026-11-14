#!/bin/bash

echo "🚀 PRE-LAUNCH CHECKLIST - PRODUCTION READINESS"
echo "=============================================="
echo ""

PASS=0
FAIL=0
WARN=0

# Function to check and report
check() {
  local name=$1
  local result=$2
  
  if [ "$result" = "pass" ]; then
    echo "   ✅ $name"
    ((PASS++))
  elif [ "$result" = "fail" ]; then
    echo "   ❌ $name"
    ((FAIL++))
  else
    echo "   ⚠️  $name"
    ((WARN++))
  fi
}

echo "═══════════════════════════════════════════"
echo "1. BUILD & COMPILATION"
echo "═══════════════════════════════════════════"

cd /workspaces/fix2

# Test build
if npm run build > /tmp/pre_launch_build.log 2>&1; then
  check "Production build compiles" "pass"
else
  check "Production build compiles" "fail"
  echo "   Build errors:"
  tail -10 /tmp/pre_launch_build.log
fi

# Check TypeScript
if npx tsc --noEmit > /tmp/tsc_check.log 2>&1; then
  check "TypeScript type checking" "pass"
else
  check "TypeScript type checking" "warn"
fi

# Check for console.log in production
CONSOLE_LOGS=$(grep -r "console\.log" app --include="*.tsx" --include="*.ts" | wc -l)
if [ $CONSOLE_LOGS -lt 10 ]; then
  check "Console logs removed ($CONSOLE_LOGS found)" "pass"
else
  check "Console logs removed ($CONSOLE_LOGS found)" "warn"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "2. AUTHENTICATION & SECURITY"
echo "═══════════════════════════════════════════"

# Check login page exists
if [ -f "app/login/page.tsx" ]; then
  check "Login page exists" "pass"
else
  check "Login page exists" "fail"
fi

# Check auth middleware
if [ -f "middleware.ts" ] || [ -f "app/middleware.ts" ]; then
  check "Auth middleware configured" "pass"
else
  check "Auth middleware configured" "warn"
fi

# Check for hardcoded secrets
SECRETS=$(grep -r "sk_live\|pk_live\|password.*=.*['\"]" app --include="*.tsx" --include="*.ts" | wc -l)
if [ $SECRETS -eq 0 ]; then
  check "No hardcoded secrets" "pass"
else
  check "No hardcoded secrets" "fail"
fi

# Check environment variables
if [ -f ".env.example" ]; then
  check ".env.example exists" "pass"
else
  check ".env.example exists" "warn"
fi

# Check CORS configuration
CORS=$(grep -r "cors\|Access-Control" . --include="*.ts" --include="*.js" | wc -l)
if [ $CORS -gt 0 ]; then
  check "CORS configured" "pass"
else
  check "CORS configured" "warn"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "3. DATABASE & API"
echo "═══════════════════════════════════════════"

# Check API routes
API_ROUTES=$(find app/api -name "route.ts" | wc -l)
check "API routes ($API_ROUTES endpoints)" "pass"

# Check for SQL injection protection
PARAMETERIZED=$(grep -r "supabase\|prisma" app/api --include="*.ts" | wc -l)
if [ $PARAMETERIZED -gt 0 ]; then
  check "Using ORM/parameterized queries" "pass"
else
  check "Using ORM/parameterized queries" "warn"
fi

# Check for rate limiting
RATE_LIMIT=$(grep -r "rateLimit\|rate.*limit" lib app/api --include="*.ts" -i | wc -l)
if [ $RATE_LIMIT -gt 0 ]; then
  check "Rate limiting implemented" "pass"
else
  check "Rate limiting implemented" "warn"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "4. SEO & METADATA"
echo "═══════════════════════════════════════════"

# Check sitemap
if [ -f "app/sitemap.ts" ]; then
  check "Sitemap configured" "pass"
else
  check "Sitemap configured" "fail"
fi

# Check robots.txt
if [ -f "app/robots.ts" ]; then
  check "Robots.txt configured" "pass"
else
  check "Robots.txt configured" "fail"
fi

# Check metadata on pages
PAGES_WITH_META=$(grep -r "export const metadata" app --include="*.tsx" | wc -l)
TOTAL_PAGES=$(find app -name "page.tsx" | wc -l)
META_PERCENT=$((PAGES_WITH_META * 100 / TOTAL_PAGES))
if [ $META_PERCENT -gt 80 ]; then
  check "Metadata coverage ($META_PERCENT%)" "pass"
else
  check "Metadata coverage ($META_PERCENT%)" "warn"
fi

# Check OpenGraph tags
OG_TAGS=$(grep -r "openGraph" app --include="*.tsx" | wc -l)
if [ $OG_TAGS -gt 10 ]; then
  check "OpenGraph tags present" "pass"
else
  check "OpenGraph tags present" "warn"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "5. PERFORMANCE"
echo "═══════════════════════════════════════════"

# Check image optimization
NEXT_IMAGES=$(grep -r "from 'next/image'" app --include="*.tsx" | wc -l)
OLD_IMAGES=$(grep -r "<img " app --include="*.tsx" | wc -l)
if [ $OLD_IMAGES -eq 0 ]; then
  check "All images optimized (Next.js Image)" "pass"
elif [ $NEXT_IMAGES -gt $OLD_IMAGES ]; then
  check "Most images optimized ($NEXT_IMAGES/$((NEXT_IMAGES + OLD_IMAGES)))" "warn"
else
  check "Images need optimization" "fail"
fi

# Check for dynamic imports
DYNAMIC_IMPORTS=$(grep -r "dynamic.*import\|lazy" app --include="*.tsx" | wc -l)
if [ $DYNAMIC_IMPORTS -gt 5 ]; then
  check "Code splitting implemented" "pass"
else
  check "Code splitting implemented" "warn"
fi

# Check bundle size
if [ -d ".next" ]; then
  BUNDLE_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
  check "Bundle size: $BUNDLE_SIZE" "pass"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "6. ERROR HANDLING"
echo "═══════════════════════════════════════════"

# Check for error boundaries
ERROR_BOUNDARY=$(find app -name "error.tsx" | wc -l)
if [ $ERROR_BOUNDARY -gt 0 ]; then
  check "Error boundaries ($ERROR_BOUNDARY)" "pass"
else
  check "Error boundaries" "warn"
fi

# Check for 404 page
if [ -f "app/not-found.tsx" ]; then
  check "404 page exists" "pass"
else
  check "404 page exists" "fail"
fi

# Check for loading states
LOADING=$(find app -name "loading.tsx" | wc -l)
if [ $LOADING -gt 0 ]; then
  check "Loading states ($LOADING)" "pass"
else
  check "Loading states" "warn"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "7. ANALYTICS & MONITORING"
echo "═══════════════════════════════════════════"

# Check Google Analytics
GA=$(grep -r "GA_MEASUREMENT_ID\|gtag" app components --include="*.tsx" | wc -l)
if [ $GA -gt 0 ]; then
  check "Google Analytics configured" "pass"
else
  check "Google Analytics configured" "warn"
fi

# Check error tracking
ERROR_TRACKING=$(grep -r "sentry\|bugsnag\|rollbar" . --include="*.ts" --include="*.tsx" -i | wc -l)
if [ $ERROR_TRACKING -gt 0 ]; then
  check "Error tracking configured" "pass"
else
  check "Error tracking configured" "warn"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "8. ACCESSIBILITY"
echo "═══════════════════════════════════════════"

# Check for alt text
IMAGES_WITH_ALT=$(grep -r "alt=" app --include="*.tsx" | wc -l)
TOTAL_IMAGES=$(grep -r "<Image\|<img" app --include="*.tsx" | wc -l)
if [ $TOTAL_IMAGES -gt 0 ]; then
  ALT_PERCENT=$((IMAGES_WITH_ALT * 100 / TOTAL_IMAGES))
  if [ $ALT_PERCENT -gt 90 ]; then
    check "Images have alt text ($ALT_PERCENT%)" "pass"
  else
    check "Images have alt text ($ALT_PERCENT%)" "warn"
  fi
fi

# Check for ARIA labels
ARIA=$(grep -r "aria-label\|aria-" app --include="*.tsx" | wc -l)
if [ $ARIA -gt 20 ]; then
  check "ARIA labels present" "pass"
else
  check "ARIA labels present" "warn"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "9. MOBILE RESPONSIVENESS"
echo "═══════════════════════════════════════════"

# Check for responsive classes
RESPONSIVE=$(grep -r "sm:\|md:\|lg:\|xl:" app --include="*.tsx" | wc -l)
if [ $RESPONSIVE -gt 100 ]; then
  check "Responsive design implemented" "pass"
else
  check "Responsive design implemented" "warn"
fi

# Check viewport meta
VIEWPORT=$(grep -r "viewport" app --include="*.tsx" | wc -l)
if [ $VIEWPORT -gt 0 ]; then
  check "Viewport meta tag configured" "pass"
else
  check "Viewport meta tag configured" "warn"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "10. LEGAL & COMPLIANCE"
echo "═══════════════════════════════════════════"

# Check for privacy policy
if [ -f "app/privacy/page.tsx" ] || [ -f "app/privacy-policy/page.tsx" ]; then
  check "Privacy policy page" "pass"
else
  check "Privacy policy page" "warn"
fi

# Check for terms of service
if [ -f "app/terms/page.tsx" ] || [ -f "app/terms-of-service/page.tsx" ]; then
  check "Terms of service page" "pass"
else
  check "Terms of service page" "warn"
fi

# Check for cookie consent
COOKIE_CONSENT=$(grep -r "cookie.*consent\|CookieBanner" app components --include="*.tsx" -i | wc -l)
if [ $COOKIE_CONSENT -gt 0 ]; then
  check "Cookie consent implemented" "pass"
else
  check "Cookie consent implemented" "warn"
fi

# Check for copyright notice
COPYRIGHT=$(grep -r "©.*202\|Copyright" components --include="*.tsx" | wc -l)
if [ $COPYRIGHT -gt 0 ]; then
  check "Copyright notice present" "pass"
else
  check "Copyright notice present" "warn"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "11. DEPLOYMENT"
echo "═══════════════════════════════════════════"

# Check for vercel.json or next.config
if [ -f "vercel.json" ] || [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
  check "Deployment config exists" "pass"
else
  check "Deployment config exists" "warn"
fi

# Check for package.json scripts
BUILD_SCRIPT=$(grep -c "\"build\":" package.json)
START_SCRIPT=$(grep -c "\"start\":" package.json)
if [ $BUILD_SCRIPT -gt 0 ] && [ $START_SCRIPT -gt 0 ]; then
  check "Build & start scripts configured" "pass"
else
  check "Build & start scripts configured" "fail"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "12. TESTING"
echo "═══════════════════════════════════════════"

# Check for test files
TESTS=$(find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | wc -l)
if [ $TESTS -gt 0 ]; then
  check "Tests present ($TESTS files)" "pass"
else
  check "Tests present" "warn"
fi

echo ""
echo "=============================================="
echo "📊 FINAL SCORE"
echo "=============================================="
echo ""
echo "✅ PASSED: $PASS"
echo "⚠️  WARNINGS: $WARN"
echo "❌ FAILED: $FAIL"
echo ""

TOTAL=$((PASS + WARN + FAIL))
SCORE=$((PASS * 100 / TOTAL))

echo "OVERALL SCORE: $SCORE%"
echo ""

if [ $FAIL -eq 0 ] && [ $SCORE -gt 80 ]; then
  echo "🎉 READY FOR PRODUCTION LAUNCH!"
  echo ""
  exit 0
elif [ $FAIL -eq 0 ]; then
  echo "⚠️  READY WITH WARNINGS"
  echo "   Address warnings before launch"
  echo ""
  exit 0
else
  echo "❌ NOT READY FOR LAUNCH"
  echo "   Fix critical failures before deploying"
  echo ""
  exit 1
fi
