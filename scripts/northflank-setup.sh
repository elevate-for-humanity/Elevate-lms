#!/bin/bash
# =============================================================================
# Northflank Setup Script for Elevate LMS
# =============================================================================
# This script configures all 3 services with the required secrets
# 
# Usage:
#   ./scripts/northflank-setup.sh <supabase-url> <supabase-anon-key> <supabase-service-key>
#                           <stripe-secret> <stripe-webhook-secret> <sendgrid-key>
#                           <admin-api-key>
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  Elevate LMS - Northflank Setup${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""

# Check if Northflank CLI is installed
if ! command -v nfctl &> /dev/null; then
    echo -e "${YELLOW}Northflank CLI not found. Installing...${NC}"
    # Instructions for manual setup
    echo ""
    echo "Please set up secrets manually in Northflank dashboard:"
    echo "1. Go to your Northflank project"
    echo "2. Select each service (LMS, Admin, Marketing)"
    echo "3. Add secrets from northflank/*.secrets.json"
    echo ""
    exit 0
fi

# Validate required arguments
if [ "$#" -lt 3 ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo ""
    echo "Usage: $0 <supabase-url> <supabase-anon-key> <supabase-service-key> [stripe-secret] [stripe-webhook] [sendgrid-key]"
    echo ""
    echo "Required secrets:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    exit 1
fi

SUPABASE_URL="$1"
SUPABASE_ANON="$2"
SUPABASE_SERVICE="$3"
STRIPE_SECRET="${4:-}"
STRIPE_WEBHOOK="${5:-}"
SENDGRID_KEY="${6:-}"
ADMIN_API_KEY="${7:-$(openssl rand -hex 24)}"

echo -e "${GREEN}Configuring secrets for all 3 services...${NC}"
echo ""

# =============================================================================
# LMS SERVICE SECRETS
# =============================================================================
echo -e "${YELLOW}Configuring LMS Service...${NC}"

nfctl secret create elevate-lms NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" || true
nfctl secret create elevate-lms NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON" || true
nfctl secret create elevate-lms SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE" || true
nfctl secret create elevate-lms NEXT_PUBLIC_SITE_URL "https://www.elevateforhumanity.org" || true

if [ -n "$STRIPE_SECRET" ]; then
    nfctl secret create elevate-lms STRIPE_SECRET_KEY "$STRIPE_SECRET" || true
fi
if [ -n "$STRIPE_WEBHOOK" ]; then
    nfctl secret create elevate-lms STRIPE_WEBHOOK_SECRET "$STRIPE_WEBHOOK" || true
fi
if [ -n "$SENDGRID_KEY" ]; then
    nfctl secret create elevate-lms SENDGRID_API_KEY "$SENDGRID_KEY" || true
fi

echo -e "${GREEN}LMS secrets configured ✓${NC}"
echo ""

# =============================================================================
# ADMIN SERVICE SECRETS
# =============================================================================
echo -e "${YELLOW}Configuring Admin Service...${NC}"

nfctl secret create elevate-admin NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" || true
nfctl secret create elevate-admin NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON" || true
nfctl secret create elevate-admin SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE" || true
nfctl secret create elevate-admin NEXT_PUBLIC_SITE_URL "https://www.elevateforhumanity.org" || true
nfctl secret create elevate-admin NEXT_PUBLIC_ADMIN_URL "https://admin.elevateforhumanity.org" || true
nfctl secret create elevate-admin ADMIN_API_KEY "$ADMIN_API_KEY" || true
nfctl secret create elevate-admin ADMIN_EMAIL "elevate4humanityedu@gmail.com" || true

echo -e "${GREEN}Admin secrets configured ✓${NC}"
echo ""

# =============================================================================
# MARKETING SERVICE SECRETS
# =============================================================================
echo -e "${YELLOW}Configuring Marketing Service...${NC}"

nfctl secret create elevate-marketing NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" || true
nfctl secret create elevate-marketing NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON" || true
nfctl secret create elevate-marketing NEXT_PUBLIC_SITE_URL "https://www.elevateforhumanity.org" || true

if [ -n "$SENDGRID_KEY" ]; then
    nfctl secret create elevate-marketing SENDGRID_API_KEY "$SENDGRID_KEY" || true
fi

echo -e "${GREEN}Marketing secrets configured ✓${NC}"
echo ""

# =============================================================================
# TRIGGER BUILDS
# =============================================================================
echo -e "${YELLOW}Triggering builds...${NC}"

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify secrets in Northflank dashboard"
echo "2. Trigger manual build if needed"
echo "3. Check health endpoints after deploy"
echo ""
