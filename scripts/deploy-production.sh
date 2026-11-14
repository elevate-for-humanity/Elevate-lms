#!/usr/bin/env bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "  Production Deployment Script"
echo "=========================================="
echo ""

# Pre-flight checks
echo "Running pre-flight checks..."
echo ""

# Check 1: Git status
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
  git status --short
  echo ""
  read -p "Continue anyway? (y/n): " continue_git
  if [ "$continue_git" != "y" ]; then
    echo "Cancelled"
    exit 1
  fi
fi

# Check 2: Environment variables
echo "Checking environment variables..."
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  "STRIPE_SECRET_KEY"
  "RESEND_API_KEY"
  "OPENAI_API_KEY"
  "NEXT_PUBLIC_SENTRY_DSN"
)

MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
  if ! vercel env ls 2>/dev/null | grep -q "$var"; then
    echo -e "${RED}❌${NC} $var not in Vercel"
    ((MISSING_VARS++))
  fi
done

if [ $MISSING_VARS -gt 0 ]; then
  echo ""
  echo -e "${RED}❌ $MISSING_VARS required variables missing in Vercel${NC}"
  echo ""
  echo "Add them with:"
  echo "  vercel env add VARIABLE_NAME"
  echo ""
  read -p "Continue anyway? (y/n): " continue_env
  if [ "$continue_env" != "y" ]; then
    echo "Cancelled"
    exit 1
  fi
fi

# Check 3: Run tests
echo ""
echo "Running tests..."
if npm run lint && npm test; then
  echo -e "${GREEN}✅ Tests passed${NC}"
else
  echo -e "${RED}❌ Tests failed${NC}"
  read -p "Continue anyway? (y/n): " continue_tests
  if [ "$continue_tests" != "y" ]; then
    echo "Cancelled"
    exit 1
  fi
fi

# Check 4: Build test
echo ""
echo "Running build test..."
if npm run build; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  echo "Fix build errors before deploying"
  exit 1
fi

# Deployment
echo ""
echo "=========================================="
echo "  Deploying to Production"
echo "=========================================="
echo ""

read -p "Deploy to production? (y/n): " deploy_confirm

if [ "$deploy_confirm" != "y" ]; then
  echo "Cancelled"
  exit 0
fi

echo ""
echo "Deploying..."
vercel --prod

echo ""
echo "=========================================="
echo "  Post-Deployment Verification"
echo "=========================================="
echo ""

echo "Waiting for deployment to complete..."
sleep 30

# Verify health endpoint
echo "Checking health endpoint..."
HEALTH_URL="https://www.elevateforhumanity.org/api/health"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)

if [ "$HEALTH_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Health check passed (200)${NC}"
elif [ "$HEALTH_CODE" = "503" ]; then
  echo -e "${YELLOW}⚠️  Health check degraded (503)${NC}"
  echo "Some services may not be configured"
else
  echo -e "${RED}❌ Health check failed ($HEALTH_CODE)${NC}"
fi

# Run smoke tests
echo ""
echo "Running smoke tests..."
if bash scripts/smoke-test-portal.sh https://www.elevateforhumanity.org; then
  echo -e "${GREEN}✅ Smoke tests passed${NC}"
else
  echo -e "${YELLOW}⚠️  Some smoke tests failed${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Production URL: https://www.elevateforhumanity.org"
echo "Health Check: $HEALTH_URL"
echo "Sentry Dashboard: https://sentry.io"
echo ""
echo "Next steps:"
echo "  1. Monitor Sentry for errors"
echo "  2. Check health endpoint regularly"
echo "  3. Review user feedback"
echo "  4. Monitor performance metrics"
echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo ""
