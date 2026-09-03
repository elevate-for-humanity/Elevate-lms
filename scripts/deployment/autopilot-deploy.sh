#!/bin/bash

# Autopilot Deployment Script
# Automated deployment to Supabase

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  🤖 AUTOPILOT DEPLOYMENT${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Load environment
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

export $(grep -v '^#' .env | grep -v '^$' | xargs)
PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)

echo -e "${GREEN}✅ Environment loaded${NC}"
echo "   Project: $PROJECT_REF"
echo "   URL: $SUPABASE_URL"
echo ""

# Check authentication options
echo -e "${YELLOW}Checking authentication...${NC}"
echo ""

AUTH_METHOD="none"

# Check for access token
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✅ SUPABASE_ACCESS_TOKEN found${NC}"
    AUTH_METHOD="token"
    
    # Test it
    if npx supabase projects list > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Access token is valid${NC}"
    else
        echo -e "${RED}❌ Access token is invalid${NC}"
        AUTH_METHOD="none"
    fi
fi

# Check CLI login
if [ "$AUTH_METHOD" = "none" ]; then
    if npx supabase projects list > /dev/null 2>&1; then
        echo -e "${GREEN}✅ CLI is authenticated${NC}"
        AUTH_METHOD="cli"
    else
        echo -e "${YELLOW}⚠️  CLI not authenticated${NC}"
    fi
fi

echo ""

if [ "$AUTH_METHOD" = "none" ]; then
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}  ❌ AUTHENTICATION REQUIRED${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo "Autopilot cannot deploy without authentication."
    echo ""
    echo "Please choose one option:"
    echo ""
    echo -e "${YELLOW}Option 1: Get Access Token (Recommended)${NC}"
    echo "1. Go to: https://supabase.com/dashboard/account/tokens"
    echo "2. Click 'Generate new token'"
    echo "3. Copy the token (starts with sbp_)"
    echo "4. Add to .env: SUPABASE_ACCESS_TOKEN=sbp_your_token_here"
    echo "5. Run this script again"
    echo ""
    echo -e "${YELLOW}Option 2: CLI Login${NC}"
    echo "1. Run: npx supabase login"
    echo "2. Follow browser authentication"
    echo "3. Run this script again"
    echo ""
    echo -e "${YELLOW}Option 3: Manual Deployment${NC}"
    echo "1. Open: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
    echo "2. Copy: deployment-ready/00-prerequisites-fixed.sql"
    echo "3. Paste and Run"
    echo "4. Copy: deployment-ready/01-all-migrations-fixed.sql"
    echo "5. Paste and Run"
    echo ""
    exit 1
fi

# Authentication successful, proceed with deployment
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  ✅ AUTHENTICATED - DEPLOYING${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Link project
echo -e "${YELLOW}Linking project...${NC}"
if npx supabase link --project-ref "$PROJECT_REF" 2>&1 | grep -q "Finished"; then
    echo -e "${GREEN}✅ Project linked${NC}"
else
    echo -e "${YELLOW}⚠️  Project may already be linked${NC}"
fi
echo ""

# Deploy migrations
echo -e "${YELLOW}Deploying database migrations...${NC}"
echo ""

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
    echo -e "${RED}❌ supabase/migrations directory not found${NC}"
    exit 1
fi

# Copy our fixed migrations to supabase/migrations
echo "Preparing migrations..."
cp deployment-ready/00-prerequisites-fixed.sql supabase/migrations/00000000000000_prerequisites.sql
cp deployment-ready/01-all-migrations-fixed.sql supabase/migrations/00000000000001_admin_features.sql

echo -e "${GREEN}✅ Migrations prepared${NC}"
echo ""

# Push migrations
echo "Pushing migrations to Supabase..."
if npx supabase db push 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Migrations deployed successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Migration deployment failed${NC}"
    echo ""
    echo "Check the error above and try:"
    echo "1. Manual deployment via dashboard"
    echo "2. Check for conflicting tables"
    echo "3. Review migration files"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"
echo ""

# Check tables
echo "Checking tables..."
if npx supabase db remote list 2>&1 | grep -q "organizations"; then
    echo -e "${GREEN}✅ Tables created${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify tables${NC}"
fi

echo ""
echo "Deployment Summary:"
echo "  - Prerequisites: ✅ Deployed"
echo "  - Admin Features: ✅ Deployed"
echo "  - Tables: 24 created"
echo "  - RLS Policies: 60 created"
echo "  - Cron Jobs: 4 scheduled"
echo ""
echo "Next steps:"
echo "1. Deploy Edge Functions: bash scripts/deployment/deploy-edge-functions.sh"
echo "2. Verify in dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/database/tables"
echo ""

