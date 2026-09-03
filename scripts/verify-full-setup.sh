#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Full Blueprint Verification"
echo "=============================="
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_pass() {
  echo -e "   ${GREEN}✅${NC} $1"
}

check_fail() {
  echo -e "   ${RED}❌${NC} $1"
  ERRORS=$((ERRORS + 1))
}

check_warn() {
  echo -e "   ${YELLOW}⚠️${NC}  $1"
  WARNINGS=$((WARNINGS + 1))
}

# 1. Render Configuration
echo -e "${BLUE}1️⃣  Render Configuration${NC}"
if [ -f "render.yaml" ]; then
  check_pass "render.yaml exists"
  
  # Check build command
  if grep -q "buildCommand.*pnpm.*build" render.yaml; then
    check_pass "Build command uses pnpm"
  else
    check_warn "Build command may need updating"
  fi
  
  # Check start command
  if grep -q "startCommand.*serve-static.cjs" render.yaml; then
    check_pass "Start command uses serve-static.cjs"
  else
    check_warn "Start command may need updating"
  fi
  
  # Check environment variables
  if grep -q "VITE_SUPABASE_URL" render.yaml; then
    check_pass "VITE_SUPABASE_URL configured"
  else
    check_fail "VITE_SUPABASE_URL missing"
  fi
  
  if grep -q "VITE_SUPABASE_ANON_KEY" render.yaml; then
    check_pass "VITE_SUPABASE_ANON_KEY configured"
  else
    check_fail "VITE_SUPABASE_ANON_KEY missing"
  fi
else
  check_fail "render.yaml not found"
fi
echo ""

# 2. Cloudflare Pages Configuration
echo -e "${BLUE}2️⃣  Cloudflare Pages Configuration${NC}"
if [ -f "CLOUDFLARE_PAGES_SETUP.md" ]; then
  check_pass "Cloudflare setup documentation exists"
else
  check_warn "Cloudflare setup documentation missing"
fi

if [ -f "public/_redirects" ]; then
  check_pass "public/_redirects exists"
  
  if grep -q "/\* /index.html 200" public/_redirects || grep -q "/\*   /index.html   200" public/_redirects; then
    check_pass "SPA fallback rule configured"
  else
    check_fail "SPA fallback rule missing"
  fi
else
  check_fail "public/_redirects missing"
fi

if [ -f "public/_headers" ]; then
  check_pass "public/_headers exists"
  
  if grep -q "X-Frame-Options" public/_headers; then
    check_pass "Security headers configured"
  else
    check_warn "Security headers may be incomplete"
  fi
else
  check_warn "public/_headers missing (optional)"
fi
echo ""

# 3. Supabase Configuration
echo -e "${BLUE}3️⃣  Supabase Configuration${NC}"

# Check env guard
if [ -f "src/env-guard.ts" ]; then
  check_pass "Frontend env guard exists"
  
  if grep -q "VITE_SUPABASE_URL" src/env-guard.ts; then
    check_pass "Checks VITE_SUPABASE_URL"
  fi
  
  if grep -q "VITE_SUPABASE_ANON_KEY" src/env-guard.ts; then
    check_pass "Checks VITE_SUPABASE_ANON_KEY"
  fi
else
  check_fail "Frontend env guard missing"
fi

# Check supabase client
if [ -f "src/supabaseClient.js" ] || [ -f "src/lib/supabase.ts" ]; then
  check_pass "Supabase client configured"
else
  check_warn "Supabase client file not found"
fi

# Check backend env guard
if [ -f "backend/env-guard.js" ]; then
  check_pass "Backend env guard exists"
  
  if grep -q "SUPABASE_URL" backend/env-guard.js; then
    check_pass "Checks SUPABASE_URL"
  fi
  
  if grep -q "SUPABASE_SERVICE_KEY" backend/env-guard.js; then
    check_pass "Checks SUPABASE_SERVICE_KEY"
  fi
else
  check_warn "Backend env guard missing"
fi
echo ""

# 4. Build Configuration
echo -e "${BLUE}4️⃣  Build Configuration${NC}"

if [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then
  check_pass "Vite config exists"
  
  CONFIG_FILE="vite.config.js"
  [ -f "vite.config.ts" ] && CONFIG_FILE="vite.config.ts"
  
  if grep -q "base.*:" "$CONFIG_FILE"; then
    if grep -q "base.*['\"]/" "$CONFIG_FILE"; then
      check_pass "base: '/' configured"
    else
      check_warn "base may not be set to '/'"
    fi
  else
    check_warn "base not explicitly set"
  fi
  
  if grep -q "outDir.*dist" "$CONFIG_FILE"; then
    check_pass "outDir: 'dist' configured"
  else
    check_warn "outDir may not be 'dist'"
  fi
else
  check_fail "Vite config missing"
fi

if [ -f "index.html" ]; then
  check_pass "index.html at repo root"
else
  check_fail "index.html missing from repo root"
fi

if [ -f "package.json" ]; then
  check_pass "package.json exists"
  
  if grep -q '"build:frontend"' package.json; then
    check_pass "build:frontend script exists"
  else
    check_warn "build:frontend script missing"
  fi
  
  if grep -q '"start".*serve-static.cjs' package.json; then
    check_pass "start script uses serve-static.cjs"
  else
    check_warn "start script may need updating"
  fi
else
  check_fail "package.json missing"
fi
echo ""

# 5. Static Server Configuration
echo -e "${BLUE}5️⃣  Static Server Configuration${NC}"

if [ -f "serve-static.cjs" ]; then
  check_pass "serve-static.cjs exists"
  
  if grep -q "compression" serve-static.cjs; then
    check_pass "Uses compression"
  fi
  
  if grep -q "express.static.*dist" serve-static.cjs; then
    check_pass "Serves from dist/"
  else
    check_fail "May not serve from dist/"
  fi
else
  check_fail "serve-static.cjs missing"
fi

# Check compression dependency
if grep -q '"compression"' package.json; then
  check_pass "compression dependency installed"
else
  check_fail "compression dependency missing"
fi
echo ""

# 6. Auto-Deployment Setup
echo -e "${BLUE}6️⃣  Auto-Deployment Setup${NC}"

if [ -d ".github/workflows" ]; then
  check_pass ".github/workflows directory exists"
  
  if [ -f ".github/workflows/autopilot-render.yml" ]; then
    check_pass "Render autopilot workflow exists"
  else
    check_warn "Render autopilot workflow missing"
  fi
  
  if [ -f ".github/workflows/autopilot-deploy.yml" ]; then
    check_pass "Deploy workflow exists"
  else
    check_warn "Deploy workflow missing"
  fi
else
  check_warn ".github/workflows directory missing"
fi

# Check for deploy hooks
if grep -q "RENDER_DEPLOY_HOOK" .github/workflows/*.yml 2>/dev/null; then
  check_pass "Render deploy hook configured in workflow"
else
  check_warn "Render deploy hook not found in workflows"
fi
echo ""

# 7. Verification Scripts
echo -e "${BLUE}7️⃣  Verification Scripts${NC}"

SCRIPTS=(
  "scripts/autopilot-build-web.sh"
  "scripts/autopilot-verify-build.sh"
  "scripts/render/poll-render.js"
  "check-deployment-status.sh"
)

for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    if [ -x "$script" ]; then
      check_pass "$script (executable)"
    else
      check_warn "$script (not executable)"
    fi
  else
    check_warn "$script missing"
  fi
done
echo ""

# 8. Documentation
echo -e "${BLUE}8️⃣  Documentation${NC}"

DOCS=(
  "AUTOPILOT_COMPLETE.md"
  "AUTOPILOT_RENDER_SETUP.md"
  "BUILD_VERIFICATION_COMPLETE.md"
  "CLOUDFLARE_PAGES_SETUP.md"
  "DEPLOYMENT_STATUS.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    check_pass "$doc"
  else
    check_warn "$doc missing"
  fi
done
echo ""

# 9. Build Output Verification
echo -e "${BLUE}9️⃣  Build Output Verification${NC}"

if [ -d "dist" ]; then
  check_pass "dist/ directory exists"
  
  if [ -f "dist/index.html" ]; then
    check_pass "dist/index.html exists"
    
    SIZE=$(stat -f%z "dist/index.html" 2>/dev/null || stat -c%s "dist/index.html" 2>/dev/null || echo "0")
    if [ "$SIZE" -gt 100 ]; then
      check_pass "dist/index.html size: $SIZE bytes"
    else
      check_fail "dist/index.html too small: $SIZE bytes"
    fi
  else
    check_warn "dist/index.html missing (run build)"
  fi
  
  if [ -f "dist/_redirects" ]; then
    check_pass "dist/_redirects exists"
  else
    check_warn "dist/_redirects missing (run build)"
  fi
  
  if [ -d "dist/assets" ]; then
    JS_COUNT=$(find dist/assets -name "*.js" 2>/dev/null | wc -l || echo "0")
    check_pass "dist/assets/ exists ($JS_COUNT JS files)"
  else
    check_warn "dist/assets/ missing (run build)"
  fi
else
  check_warn "dist/ directory missing (run build)"
fi
echo ""

# 10. Git Configuration
echo -e "${BLUE}🔟 Git Configuration${NC}"

if git rev-parse --git-dir > /dev/null 2>&1; then
  check_pass "Git repository initialized"
  
  BRANCH=$(git branch --show-current)
  check_pass "Current branch: $BRANCH"
  
  REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
  if [ -n "$REMOTE" ]; then
    check_pass "Remote: $REMOTE"
  else
    check_warn "No remote configured"
  fi
  
  # Check for uncommitted changes
  if git diff --quiet && git diff --cached --quiet; then
    check_pass "No uncommitted changes"
  else
    check_warn "Uncommitted changes present"
  fi
else
  check_fail "Not a git repository"
fi
echo ""

# Summary
echo "=============================="
echo -e "${BLUE}📊 Summary${NC}"
echo "=============================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Perfect! All checks passed!${NC}"
  echo ""
  echo "🚀 Your setup is fully configured and ready to deploy!"
  EXIT_CODE=0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
  echo ""
  echo "✅ No critical errors, but some improvements recommended"
  EXIT_CODE=0
else
  echo -e "${RED}❌ $ERRORS error(s) found${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
  fi
  echo ""
  echo "🔧 Fix the errors above before deploying"
  EXIT_CODE=1
fi

echo ""
echo "📋 Next Steps:"
echo "1. Fix any errors/warnings above"
echo "2. Run: ./scripts/autopilot-build-web.sh"
echo "3. Run: ./scripts/render/audit-and-cleanup.sh"
echo "4. Deploy to Render"
echo ""

exit $EXIT_CODE
