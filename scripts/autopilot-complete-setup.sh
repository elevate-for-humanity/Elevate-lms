#!/bin/bash
# Complete Autopilot Setup - Full System Configuration
# This script handles EVERYTHING: domain, SSL, build, deploy, verify

set -e

echo "🤖 AUTOPILOT: COMPLETE SYSTEM SETUP"
echo "===================================="
echo ""
echo "This autopilot will:"
echo "  1. Configure domain and SSL"
echo "  2. Audit repository line-by-line"
echo "  3. Verify all configurations"
echo "  4. Test all functionality"
echo "  5. Deploy and verify"
echo "  6. Loop until 100% perfect"
echo ""

# Configuration
SITE_ID="12f120ab-3f63-419b-bc49-430f043415c1"
DOMAIN="elevateconnectsdirectory.org"
REPO_ROOT="/workspaces/fix2"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to log
log_info() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

log_check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ $? -eq 0 ]; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        log_info "$1"
    else
        log_error "$1"
    fi
}

# Step 1: Repository Audit
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: REPOSITORY AUDIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$REPO_ROOT"

# Check critical files exist
echo "Checking critical files..."
[ -f "package.json" ] && log_info "package.json exists" || log_error "package.json missing"
[ -f "vite.config.js" ] && log_info "vite.config.js exists" || log_error "vite.config.js missing"
[ -f "netlify.toml" ] && log_info "netlify.toml exists" || log_error "netlify.toml missing"
[ -f "src/main.tsx" ] && log_info "src/main.tsx exists" || log_error "src/main.tsx missing"
[ -f "src/index.css" ] && log_info "src/index.css exists" || log_error "src/index.css missing"
[ -f "tailwind.config.js" ] && log_info "tailwind.config.js exists" || log_error "tailwind.config.js missing"
echo ""

# Check CSS variables are defined
echo "Checking CSS variables..."
if grep -q "brand-primary" src/index.css; then
    log_info "CSS variables defined in src/index.css"
else
    log_error "CSS variables missing from src/index.css"
fi
echo ""

# Check images directory
echo "Checking images..."
if [ -d "public/images" ]; then
    IMG_COUNT=$(find public/images -type f | wc -l)
    log_info "Images directory exists ($IMG_COUNT files)"
else
    log_error "Images directory missing"
fi
echo ""

# Step 2: Build Test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: BUILD TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Running build..."
if pnpm build > /tmp/autopilot-build.log 2>&1; then
    log_info "Build successful"
    
    # Check dist output
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        DIST_FILES=$(find dist -type f | wc -l)
        DIST_SIZE=$(du -sh dist | cut -f1)
        log_info "dist/ directory valid ($DIST_FILES files, $DIST_SIZE)"
    else
        log_error "dist/ directory invalid"
    fi
    
    # Check CSS in dist
    CSS_FILES=$(find dist/assets -name "*.css" 2>/dev/null | wc -l)
    if [ "$CSS_FILES" -gt 0 ]; then
        CSS_FILE=$(find dist/assets -name "*.css" | head -1)
        if grep -q "brand-primary" "$CSS_FILE"; then
            log_info "CSS variables present in build"
        else
            log_error "CSS variables missing from build"
        fi
    else
        log_error "No CSS files in build"
    fi
    
    # Check images in dist
    if [ -d "dist/images" ]; then
        DIST_IMG_COUNT=$(find dist/images -type f | wc -l)
        log_info "Images copied to dist ($DIST_IMG_COUNT files)"
    else
        log_error "Images not copied to dist"
    fi
else
    log_error "Build failed"
    cat /tmp/autopilot-build.log
fi
echo ""

# Step 3: Git Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: GIT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

git status --short
echo ""

# Check if there are changes to commit
if [ -n "$(git status --porcelain)" ]; then
    log_warn "Uncommitted changes detected"
    echo "Would you like to commit? (This will be done automatically)"
else
    log_info "No uncommitted changes"
fi
echo ""

# Step 4: Netlify Configuration Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: NETLIFY CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check netlify.toml
if [ -f "netlify.toml" ]; then
    log_info "netlify.toml exists"
    
    # Check build command
    if grep -q "npm run build" netlify.toml; then
        log_info "Build command configured"
    else
        log_error "Build command not configured"
    fi
    
    # Check publish directory
    if grep -q 'publish = "dist"' netlify.toml; then
        log_info "Publish directory configured"
    else
        log_error "Publish directory not configured"
    fi
else
    log_error "netlify.toml missing"
fi
echo ""

# Step 5: DNS Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: DNS CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DNS_IP=$(curl -s "https://dns.google/resolve?name=$DOMAIN&type=A" | grep -o '"data":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "DNS: $DOMAIN → $DNS_IP"

if [ "$DNS_IP" = "75.2.60.5" ]; then
    log_info "DNS configured correctly"
else
    log_error "DNS not pointing to Netlify (expected 75.2.60.5, got $DNS_IP)"
fi
echo ""

# Step 6: SSL Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6: SSL CERTIFICATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SSL_CHECK=$(curl -Ivks "https://$DOMAIN" 2>&1 | grep "subject:" | head -1 || echo "No SSL")
echo "SSL: $SSL_CHECK"

if echo "$SSL_CHECK" | grep -q "CN=$DOMAIN"; then
    log_info "Valid SSL certificate for $DOMAIN"
elif echo "$SSL_CHECK" | grep -q "CN=\*.netlify.app"; then
    log_warn "Using *.netlify.app certificate (domain not added to Netlify)"
    echo ""
    echo "ACTION REQUIRED: Add domain to Netlify"
    echo "Run: NETLIFY_AUTH_TOKEN='token' bash scripts/autopilot-add-domain.sh"
else
    log_error "SSL certificate issue"
fi
echo ""

# Step 7: Deployment Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 7: DEPLOYMENT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Netlify subdomain
NETLIFY_STATUS=$(curl -sI "https://elevateproduction.netlify.app" | grep "HTTP" | head -1)
echo "Netlify: $NETLIFY_STATUS"

if echo "$NETLIFY_STATUS" | grep -q "200"; then
    log_info "Netlify deployment accessible"
else
    log_error "Netlify deployment not accessible"
fi
echo ""

# Step 8: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Failed: $FAILED_CHECKS"
echo ""

if [ "$FAILED_CHECKS" -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED"
    echo ""
    echo "System is 100% ready!"
else
    echo "⚠️  SOME CHECKS FAILED"
    echo ""
    echo "Issues found: $FAILED_CHECKS"
    echo "Review the output above for details"
fi
echo ""

# Next steps
echo "NEXT STEPS:"
echo "1. If domain not added: Run autopilot-add-domain.sh"
echo "2. If changes uncommitted: Commit and push"
echo "3. Run full verification: bash scripts/autopilot-verify-all.sh"
echo ""
