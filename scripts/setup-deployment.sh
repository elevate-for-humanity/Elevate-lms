#!/bin/bash
# Automated Deployment Setup Script
# Sets up environment and runs migrations automatically

set -e

echo "🚀 Elevate for Humanity - Automated Deployment Setup"
echo "======================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo ""
    echo "Creating from template..."
    cp .env.example .env.local
    
    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo ""
    echo -e "${YELLOW}📝 IMPORTANT: Add your credentials to .env.local:${NC}"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - STRIPE_PUBLIC_KEY"
    echo "   - STRIPE_SECRET_KEY"
    echo ""
    echo "Press Enter when ready to continue..."
    read
fi

# Load environment variables
source .env.local 2>/dev/null || true

# Check for required credentials
MISSING_CREDS=0

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ Missing: NEXT_PUBLIC_SUPABASE_URL${NC}"
    MISSING_CREDS=1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Missing: NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
    MISSING_CREDS=1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Missing: SUPABASE_SERVICE_ROLE_KEY${NC}"
    MISSING_CREDS=1
fi

if [ $MISSING_CREDS -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Required Supabase credentials missing${NC}"
    echo ""
    echo "Get your credentials from:"
    echo "  https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
    echo ""
    echo "Add them to .env.local and run this script again."
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Run database migrations
echo "🗄️  Running database migrations..."
echo ""

if npm run db:migrate; then
    echo ""
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo ""
    echo -e "${RED}❌ Migration failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verify Supabase credentials in .env.local"
    echo "  2. Check Supabase project is active"
    echo "  3. Ensure service role key has admin permissions"
    echo ""
    exit 1
fi

echo ""
echo "🏗️  Building application..."
echo ""

if npm run build; then
    echo ""
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo ""
    echo -e "${RED}❌ Build failed${NC}"
    echo ""
    echo "Check the errors above and fix any issues."
    exit 1
fi

echo ""
echo "======================================================"
echo -e "${GREEN}✅ Deployment setup complete!${NC}"
echo "======================================================"
echo ""
echo "📋 Next steps:"
echo ""
echo "  1. Deploy to Vercel:"
echo "     ${BLUE}vercel --prod${NC}"
echo ""
echo "  2. Or start locally:"
echo "     ${BLUE}npm run start${NC}"
echo ""
echo "  3. Configure Stripe webhooks:"
echo "     https://dashboard.stripe.com/webhooks"
echo "     Endpoint: https://your-domain.com/api/stripe/webhook"
echo ""
echo "  4. Test the deployment:"
echo "     - Visit homepage"
echo "     - Test user registration"
echo "     - Test course enrollment"
echo ""
echo "📚 Documentation:"
echo "  - DEPLOYMENT_INSTRUCTIONS.md"
echo "  - DATABASE_AUDIT_REPORT.md"
echo ""
echo "🎉 Your enterprise platform is ready to launch!"
echo ""
