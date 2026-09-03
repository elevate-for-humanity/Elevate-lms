#!/bin/bash

# Edge Functions Deployment Script
# Copyright (c) 2025 Elevate for Humanity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project reference from .env
PROJECT_REF=$(grep SUPABASE_URL .env | cut -d'=' -f2 | sed 's|https://||' | cut -d'.' -f1)

echo -e "${YELLOW}Edge Functions Deployment Script${NC}"
echo "=================================="
echo ""

# Check if logged in
echo "Checking Supabase authentication..."
if ! npx supabase projects list > /dev/null 2>&1; then
    echo -e "${RED}Error: Not logged in to Supabase${NC}"
    echo ""
    echo "Please run: npx supabase login"
    echo "Or set SUPABASE_ACCESS_TOKEN environment variable"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Deploy functions
echo "Deploying Edge Functions to project: $PROJECT_REF"
echo ""

FUNCTIONS=("email-dispatch" "webhook-dispatch" "ai-course-create" "grade-ai")

for func in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}Deploying $func...${NC}"
    if npx supabase functions deploy "$func" --project-ref "$PROJECT_REF" --no-verify-jwt; then
        echo -e "${GREEN}✓ $func deployed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to deploy $func${NC}"
        exit 1
    fi
    echo ""
done

echo -e "${GREEN}All Edge Functions deployed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Supabase dashboard"
echo "2. Run database migrations"
echo "3. Configure cron jobs"
echo ""
echo "See EDGE_FUNCTIONS_DEPLOYMENT.md for details"
