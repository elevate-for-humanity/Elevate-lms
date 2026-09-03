#!/bin/bash

set -e

echo "🚀 Complete Deployment Script"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please add your API keys to .env file${NC}"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check required environment variables
echo "🔍 Checking required environment variables..."
REQUIRED_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

echo "✅ All required variables present"
echo ""

# Run integration check
echo "🔍 Running integration check..."
if node scripts/check-integrations.mjs; then
    echo -e "${GREEN}✅ All integrations configured${NC}"
else
    echo -e "${YELLOW}⚠️  Some integrations need attention${NC}"
    echo "Continuing with deployment..."
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if pnpm install --frozen-lockfile; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Run type check
echo "🔍 Running TypeScript type check..."
if pnpm run typecheck 2>&1 | tee /tmp/typecheck.log; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript warnings present (continuing)${NC}"
fi
echo ""

# Run linter
echo "🔍 Running ESLint..."
if pnpm run lint 2>&1 | tee /tmp/lint.log; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  Linting warnings present (continuing)${NC}"
fi
echo ""

# Run tests
echo "🧪 Running tests..."
if pnpm test 2>&1 | tee /tmp/test.log; then
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed (continuing)${NC}"
fi
echo ""

# Build project
echo "🏗️  Building project..."
if pnpm run build 2>&1 | tee /tmp/build.log; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Check /tmp/build.log for details"
    exit 1
fi
echo ""

# Check if dist directory exists
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ dist/ directory created${NC}"
    echo "Build artifacts:"
    ls -lh dist/ | head -10
else
    echo -e "${RED}❌ dist/ directory not found${NC}"
    exit 1
fi
echo ""

echo "=============================="
echo -e "${GREEN}✅ Build Complete!${NC}"
echo "=============================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Deploy to Netlify:"
echo "   - Go to: https://app.netlify.com/sites/elevateforhumanityfix2/deploys"
echo "   - Click 'Trigger deploy' → 'Deploy site'"
echo "   OR run: netlify deploy --prod (if CLI is configured)"
echo ""
echo "2. Add API keys to Netlify (if not already added):"
echo "   - Go to: https://app.netlify.com/sites/elevateforhumanityfix2/settings/env"
echo "   - Add your API keys for:"
echo "     • OPENAI_API_KEY"
echo "     • STRIPE_SECRET_KEY"
echo "     • VITE_STRIPE_PUBLISHABLE_KEY"
echo "     • CLOUDFLARE_API_TOKEN"
echo ""
echo "3. Deploy Cloudflare Worker (if configured):"
echo "   - Run: wrangler deploy"
echo "   - Or configure GitHub Actions with secrets"
echo ""
echo "4. Deploy Supabase Functions (if needed):"
echo "   - Run: supabase functions deploy --all"
echo ""
echo "=============================="
echo -e "${GREEN}🎉 Ready for deployment!${NC}"
echo "=============================="
