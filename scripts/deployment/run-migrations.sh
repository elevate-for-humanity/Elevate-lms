#!/bin/bash

# Database Migrations Script
# Copyright (c) 2025 Elevate for Humanity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Database Migrations Script${NC}"
echo "=========================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env${NC}"
    exit 1
fi

echo "Supabase URL: $SUPABASE_URL"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}Warning: psql not found. Using Supabase CLI instead...${NC}"
    echo ""
    
    # Check if logged in
    if ! npx supabase projects list > /dev/null 2>&1; then
        echo -e "${RED}Error: Not logged in to Supabase${NC}"
        echo ""
        echo "Please run: npx supabase login"
        exit 1
    fi
    
    PROJECT_REF=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)
    
    echo -e "${YELLOW}Running migrations via Supabase CLI...${NC}"
    echo ""
    
    # Run migrations in order
    MIGRATIONS=(
        "supabase/migrations/20251103_admin_features.sql"
        "supabase/migrations/20251103_missing_tables.sql"
        "supabase/migrations/20251103_admin_features_rls.sql"
        "supabase/migrations/20251103_missing_tables_rls.sql"
        "supabase/migrations/20251103_cron_jobs.sql"
    )
    
    for migration in "${MIGRATIONS[@]}"; do
        if [ -f "$migration" ]; then
            echo -e "${YELLOW}Running $(basename $migration)...${NC}"
            if npx supabase db execute --project-ref "$PROJECT_REF" < "$migration"; then
                echo -e "${GREEN}✓ $(basename $migration) completed${NC}"
            else
                echo -e "${RED}✗ Failed to run $(basename $migration)${NC}"
                exit 1
            fi
            echo ""
        fi
    done
else
    # Use psql directly
    DB_URL="${SUPABASE_URL/https:\/\//postgres://postgres:}"
    DB_URL="${DB_URL}.supabase.co:5432/postgres"
    
    echo -e "${YELLOW}Running migrations via psql...${NC}"
    echo ""
    
    # Run migrations in order
    MIGRATIONS=(
        "supabase/migrations/20251103_admin_features.sql"
        "supabase/migrations/20251103_missing_tables.sql"
        "supabase/migrations/20251103_admin_features_rls.sql"
        "supabase/migrations/20251103_missing_tables_rls.sql"
        "supabase/migrations/20251103_cron_jobs.sql"
    )
    
    for migration in "${MIGRATIONS[@]}"; do
        if [ -f "$migration" ]; then
            echo -e "${YELLOW}Running $(basename $migration)...${NC}"
            if psql "$DB_URL" -f "$migration"; then
                echo -e "${GREEN}✓ $(basename $migration) completed${NC}"
            else
                echo -e "${RED}✗ Failed to run $(basename $migration)${NC}"
                exit 1
            fi
            echo ""
        fi
    done
fi

echo -e "${GREEN}All migrations completed successfully!${NC}"
echo ""
echo "Tables created:"
echo "  - email_queue, email_logs"
echo "  - webhooks, webhook_queue, webhook_logs"
echo "  - campaigns, ab_tests, funnels"
echo "  - forums, forum_posts, forum_members"
echo "  - api_keys, ai_generations, integrations"
echo ""
echo "RLS policies applied for all tables"
