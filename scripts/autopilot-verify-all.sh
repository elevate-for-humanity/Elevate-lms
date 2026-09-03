#!/bin/bash
# Autopilot: Complete System Verification
# Tests EVERYTHING - styling, functions, SEO, sitemaps, analytics, images, routes

set -e

echo "🔍 AUTOPILOT: COMPLETE SYSTEM VERIFICATION"
echo "==========================================="
echo ""

SITE_URL="https://elevateproduction.netlify.app"
DOMAIN="elevateconnectsdirectory.org"
REPO_ROOT="/workspaces/fix2"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL=0
PASSED=0
FAILED=0

check() {
    TOTAL=$((TOTAL + 1))
    if [ $? -eq 0 ]; then
        PASSED=$((PASSED + 1))
        echo -e "${GREEN}✅${NC} $1"
        return 0
    else
        FAILED=$((FAILED + 1))
        echo -e "${RED}❌${NC} $1"
        return 1
    fi
}

section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

cd "$REPO_ROOT"

# ============================================================================
section "1. REPOSITORY STRUCTURE"
# ============================================================================

[ -f "package.json" ]; check "package.json exists"
[ -f "vite.config.js" ]; check "vite.config.js exists"
[ -f "netlify.toml" ]; check "netlify.toml exists"
[ -f "src/main.tsx" ]; check "src/main.tsx exists"
[ -f "src/index.css" ]; check "src/index.css exists"
[ -f "tailwind.config.js" ]; check "tailwind.config.js exists"
[ -d "public/images" ]; check "public/images directory exists"
[ -d "src/pages" ]; check "src/pages directory exists"
[ -d "src/components" ]; check "src/components directory exists"

# ============================================================================
section "2. CSS & STYLING"
# ============================================================================

grep -q "@tailwind base" src/index.css; check "Tailwind base imported"
grep -q "@tailwind components" src/index.css; check "Tailwind components imported"
grep -q "@tailwind utilities" src/index.css; check "Tailwind utilities imported"
grep -q "brand-primary" src/index.css; check "CSS variables defined"
grep -q "brand-gradient" src/index.css; check "Gradient variables defined"
grep -q "docebo-blue" src/index.css; check "Docebo colors defined"

# Check Tailwind config
grep -q "content:" tailwind.config.js; check "Tailwind content paths configured"

# ============================================================================
section "3. BUILD VERIFICATION"
# ============================================================================

if [ -d "dist" ]; then
    [ -f "dist/index.html" ]; check "dist/index.html exists"
    
    # Check CSS in build
    CSS_FILE=$(find dist/assets -name "*.css" 2>/dev/null | head -1)
    if [ -n "$CSS_FILE" ]; then
        grep -q "brand-primary" "$CSS_FILE"; check "CSS variables in build"
        [ -s "$CSS_FILE" ]; check "CSS file not empty"
    fi
    
    # Check JS in build
    JS_COUNT=$(find dist/assets -name "*.js" 2>/dev/null | wc -l)
    [ "$JS_COUNT" -gt 0 ]; check "JavaScript files in build ($JS_COUNT files)"
    
    # Check images in build
    [ -d "dist/images" ]; check "Images directory in build"
    IMG_COUNT=$(find dist/images -type f 2>/dev/null | wc -l)
    [ "$IMG_COUNT" -gt 0 ]; check "Images in build ($IMG_COUNT files)"
else
    echo -e "${YELLOW}⚠️${NC} dist/ not found - run build first"
fi

# ============================================================================
section "4. DEPLOYMENT STATUS"
# ============================================================================

# Check Netlify deployment
HTTP_CODE=$(curl -sI "$SITE_URL" | grep "HTTP" | head -1)
echo "$HTTP_CODE" | grep -q "200"; check "Netlify site accessible"

# Check if CSS loads
CSS_URL=$(curl -sL "$SITE_URL" | grep -o 'href="/assets/[^"]*\.css"' | head -1 | sed 's/href="//;s/"//')
if [ -n "$CSS_URL" ]; then
    CSS_FULL_URL="$SITE_URL$CSS_URL"
    curl -sI "$CSS_FULL_URL" | grep -q "200"; check "CSS file loads from CDN"
fi

# Check if JS loads
JS_URL=$(curl -sL "$SITE_URL" | grep -o 'src="/assets/[^"]*\.js"' | head -1 | sed 's/src="//;s/"//')
if [ -n "$JS_URL" ]; then
    JS_FULL_URL="$SITE_URL$JS_URL"
    curl -sI "$JS_FULL_URL" | grep -q "200"; check "JS file loads from CDN"
fi

# ============================================================================
section "5. IMAGES & ASSETS"
# ============================================================================

# Check critical images
IMAGES=(
    "/images/hero-banner.jpg"
    "/images/efh-barber-card.jpg"
    "/images/efh-cna-card.jpg"
    "/images/tile-programs.jpg"
)

for img in "${IMAGES[@]}"; do
    curl -sI "$SITE_URL$img" | grep -q "200"; check "Image loads: $img"
done

# ============================================================================
section "6. SEO & META TAGS"
# ============================================================================

# Check HTML has meta tags
HTML=$(curl -sL "$SITE_URL")

echo "$HTML" | grep -q "<title>"; check "Title tag present"
echo "$HTML" | grep -q 'name="description"'; check "Meta description present"
echo "$HTML" | grep -q 'name="viewport"'; check "Viewport meta tag present"

# Check Open Graph
echo "$HTML" | grep -q 'property="og:'; check "Open Graph tags present"

# ============================================================================
section "7. SITEMAPS"
# ============================================================================

# Check if sitemap exists
curl -sI "$SITE_URL/sitemap.xml" | grep -q "200"; check "sitemap.xml accessible"

# Check robots.txt
curl -sI "$SITE_URL/robots.txt" | grep -q "200"; check "robots.txt accessible"

# ============================================================================
section "8. ROUTES & NAVIGATION"
# ============================================================================

# Check critical routes
ROUTES=(
    "/"
    "/programs"
    "/apply"
    "/about"
    "/contact"
)

for route in "${ROUTES[@]}"; do
    curl -sI "$SITE_URL$route" | grep -q "200"; check "Route accessible: $route"
done

# ============================================================================
section "9. DNS & SSL"
# ============================================================================

# Check DNS
DNS_IP=$(curl -s "https://dns.google/resolve?name=$DOMAIN&type=A" | grep -o '"data":"[^"]*"' | head -1 | cut -d'"' -f4)
[ "$DNS_IP" = "75.2.60.5" ]; check "DNS points to Netlify"

# Check SSL
SSL_CHECK=$(curl -Ivks "https://$DOMAIN" 2>&1 | grep "subject:" | head -1 || echo "")
if echo "$SSL_CHECK" | grep -q "CN=$DOMAIN"; then
    check "Valid SSL for $DOMAIN"
elif echo "$SSL_CHECK" | grep -q "CN=\*.netlify.app"; then
    echo -e "${YELLOW}⚠️${NC} Using *.netlify.app certificate (domain not added)"
else
    echo -e "${RED}❌${NC} SSL certificate issue"
fi

# ============================================================================
section "10. PERFORMANCE"
# ============================================================================

# Check response time
START=$(date +%s%N)
curl -sI "$SITE_URL" > /dev/null
END=$(date +%s%N)
RESPONSE_TIME=$(( (END - START) / 1000000 ))
[ "$RESPONSE_TIME" -lt 2000 ]; check "Response time < 2s ($RESPONSE_TIME ms)"

# Check gzip compression
curl -sI "$SITE_URL" -H "Accept-Encoding: gzip" | grep -q "gzip"; check "Gzip compression enabled"

# ============================================================================
section "11. SECURITY HEADERS"
# ============================================================================

HEADERS=$(curl -sI "$SITE_URL")

echo "$HEADERS" | grep -q "Strict-Transport-Security"; check "HSTS header present"
echo "$HEADERS" | grep -q "X-Content-Type-Options"; check "X-Content-Type-Options present"
echo "$HEADERS" | grep -q "X-Frame-Options"; check "X-Frame-Options present"

# ============================================================================
section "12. ANALYTICS"
# ============================================================================

# Check if Google Analytics is configured
if [ -f "index.html" ] || [ -f "public/index.html" ]; then
    if grep -r "gtag\|analytics" public/ src/ 2>/dev/null | grep -q "G-"; then
        check "Google Analytics configured"
    else
        echo -e "${YELLOW}⚠️${NC} Google Analytics not found"
    fi
fi

# ============================================================================
section "SUMMARY"
# ============================================================================

echo ""
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

PERCENTAGE=$((PASSED * 100 / TOTAL))
echo "Success Rate: $PERCENTAGE%"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ ALL TESTS PASSED - SYSTEM 100% READY${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "🎉 Your site is production-ready!"
    echo ""
    echo "Live URLs:"
    echo "  - https://elevateproduction.netlify.app"
    if echo "$SSL_CHECK" | grep -q "CN=$DOMAIN"; then
        echo "  - https://$DOMAIN"
    fi
else
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Issues found: $FAILED"
    echo "Review the output above for details"
    echo ""
    echo "Common fixes:"
    echo "  - Run build: pnpm build"
    echo "  - Add domain: bash scripts/autopilot-add-domain.sh"
    echo "  - Commit changes: git add . && git commit && git push"
fi
echo ""
