#!/bin/bash
# Setup Production Environment Variables

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🚀 PRODUCTION ENVIRONMENT SETUP${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if .env.production exists
if [ -f .env.production ]; then
    echo -e "${GREEN}✅ .env.production exists${NC}"
    echo ""
    
    # Backup existing
    BACKUP=".env.production.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env.production "$BACKUP"
    echo -e "${BLUE}📦 Backed up to: $BACKUP${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    echo -e "${BLUE}Creating from template...${NC}"
    echo ""
fi

# Create/update .env.production with known values
cat > .env.production << 'EOF'
# =============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# =============================================================================
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# =============================================================================

# -----------------------------------------------------------------------------
# SUPABASE - Database & Authentication
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://cuxzzpsyufcewtmicszk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=GET_FROM_SUPABASE_DASHBOARD
SUPABASE_SERVICE_ROLE_KEY=GET_FROM_SUPABASE_DASHBOARD
SUPABASE_DB_URL=postgresql://postgres:KingGreene08$$$@db.cuxzzpsyufcewtmicszk.supabase.co:5432/postgres

# -----------------------------------------------------------------------------
# SITE CONFIGURATION
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org
NEXT_PUBLIC_SITE_NAME=Elevate For Humanity
NEXT_PUBLIC_ORGANIZATION_NAME=Elevate for Humanity Career and Technical Institute
NODE_ENV=production

# -----------------------------------------------------------------------------
# AUTHENTICATION
# -----------------------------------------------------------------------------
NEXTAUTH_SECRET=zB2ZTPxFJsfJziHrY1p+gaNW4X1apaT9Y0dX9LSScl4=
NEXTAUTH_URL=https://www.elevateforhumanity.org

# -----------------------------------------------------------------------------
# STRIPE - Payment Processing
# -----------------------------------------------------------------------------
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STUDENT=
STRIPE_PRICE_CAREER=

# -----------------------------------------------------------------------------
# EMAIL - Resend
# -----------------------------------------------------------------------------
RESEND_API_KEY=GET_FROM_RESEND_DASHBOARD
EMAIL_FROM=noreply@elevateforhumanity.org
NOTIFY_EMAIL_TO=admin@elevateforhumanity.org
NOTIFY_EMAIL_FROM=noreply@elevateforhumanity.org

# -----------------------------------------------------------------------------
# AI SERVICES
# -----------------------------------------------------------------------------
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# -----------------------------------------------------------------------------
# MONITORING & ANALYTICS
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-SWPG2HVYVH

# -----------------------------------------------------------------------------
# POSTGRES
# -----------------------------------------------------------------------------
POSTGRES_PASSWORD=KingGreene08$$$
POSTGRES_USER=postgres
POSTGRES_HOST=db.cuxzzpsyufcewtmicszk.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_PORT=5432

# -----------------------------------------------------------------------------
# FEDERAL APIs
# -----------------------------------------------------------------------------
SAM_GOV_API_KEY=Vyi2/MKIhgOcxxrjHzZMtAZUFeW3AqW5Pa1IOmFYEHo=
SAM_API_TOKEN=SAM-736d2153-2d8a-475a-ad02-9e4eee1d0e99

# -----------------------------------------------------------------------------
# VERCEL
# -----------------------------------------------------------------------------
VERCEL_PROJECT_ID=prj_iUns4lz1mbDP6kRIcukXFVsDWUAV
EOF

echo -e "${GREEN}✅ Created .env.production with known values${NC}"
echo ""

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}   ⚠️  MANUAL STEPS REQUIRED${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}You need to add these 2 critical keys:${NC}"
echo ""
echo "1. Get Supabase keys from:"
echo "   ${BLUE}https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/settings/api${NC}"
echo ""
echo "2. Edit .env.production:"
echo "   ${BLUE}nano .env.production${NC}"
echo ""
echo "3. Replace these lines:"
echo "   ${YELLOW}NEXT_PUBLIC_SUPABASE_ANON_KEY=GET_FROM_SUPABASE_DASHBOARD${NC}"
echo "   ${YELLOW}SUPABASE_SERVICE_ROLE_KEY=GET_FROM_SUPABASE_DASHBOARD${NC}"
echo ""
echo "   With your actual keys (start with eyJhbGc...)"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📋 WHAT'S ALREADY SET${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "✅ NEXTAUTH_SECRET (generated)"
echo "✅ RESEND_API_KEY (for emails)"
echo "✅ NEXT_PUBLIC_GA_MEASUREMENT_ID (analytics)"
echo "✅ POSTGRES_PASSWORD"
echo "✅ SAM_GOV_API_KEY (federal APIs)"
echo "✅ Site URLs configured for production"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🎯 NEXT STEPS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "1. Add Supabase keys (see above)"
echo "2. Optionally add Stripe keys for payments"
echo "3. Copy to Vercel:"
echo "   ${BLUE}vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production${NC}"
echo "   ${BLUE}vercel env add SUPABASE_SERVICE_ROLE_KEY production${NC}"
echo "4. Deploy:"
echo "   ${BLUE}vercel --prod${NC}"
echo ""

echo -e "${GREEN}✅ Production environment template ready!${NC}"
echo ""
