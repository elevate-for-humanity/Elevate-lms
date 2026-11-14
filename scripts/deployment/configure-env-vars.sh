#!/bin/bash

# Environment Variables Configuration Helper
# Copyright (c) 2025 Elevate for Humanity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Environment Variables Configuration Helper${NC}"
echo "==========================================="
echo ""

# Check if logged in
if ! npx supabase projects list > /dev/null 2>&1; then
    echo -e "${RED}Error: Not logged in to Supabase${NC}"
    echo ""
    echo "Please run: npx supabase login"
    exit 1
fi

# Get project ref
PROJECT_REF=$(grep SUPABASE_URL .env | cut -d'=' -f2 | sed 's|https://||' | cut -d'.' -f1)

echo -e "${BLUE}Project Reference:${NC} $PROJECT_REF"
echo ""

echo -e "${YELLOW}Required Environment Variables:${NC}"
echo ""

# Email Provider
echo -e "${BLUE}1. Email Provider${NC}"
echo "   Choose ONE of the following:"
echo ""
echo "   Option A: SendGrid"
echo "   SENDGRID_API_KEY=your_sendgrid_api_key"
echo ""
echo "   Option B: Resend"
echo "   RESEND_API_KEY=your_resend_api_key"
echo ""

# AI Provider
echo -e "${BLUE}2. AI Provider${NC}"
echo "   Choose ONE of the following:"
echo ""
echo "   Option A: OpenAI"
echo "   OPENAI_API_KEY=your_openai_api_key"
echo ""
echo "   Option B: Anthropic"
echo "   ANTHROPIC_API_KEY=your_anthropic_api_key"
echo ""

echo -e "${YELLOW}Automatic Variables (provided by Supabase):${NC}"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""

echo -e "${GREEN}To set environment variables:${NC}"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
echo "2. Click 'Add new secret'"
echo "3. Enter the variable name and value"
echo "4. Click 'Save'"
echo ""

# Interactive mode
read -p "Would you like to set variables interactively? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Interactive Configuration${NC}"
    echo "========================="
    echo ""
    
    # Email provider
    echo -e "${BLUE}Email Provider:${NC}"
    echo "1) SendGrid"
    echo "2) Resend"
    echo "3) Skip"
    read -p "Choose option (1-3): " email_choice
    
    case $email_choice in
        1)
            read -p "Enter SendGrid API Key: " sendgrid_key
            if [ ! -z "$sendgrid_key" ]; then
                echo "Setting SENDGRID_API_KEY..."
                npx supabase secrets set SENDGRID_API_KEY="$sendgrid_key" --project-ref "$PROJECT_REF"
                echo -e "${GREEN}✓ SENDGRID_API_KEY set${NC}"
            fi
            ;;
        2)
            read -p "Enter Resend API Key: " resend_key
            if [ ! -z "$resend_key" ]; then
                echo "Setting RESEND_API_KEY..."
                npx supabase secrets set RESEND_API_KEY="$resend_key" --project-ref "$PROJECT_REF"
                echo -e "${GREEN}✓ RESEND_API_KEY set${NC}"
            fi
            ;;
        3)
            echo "Skipping email provider configuration"
            ;;
    esac
    
    echo ""
    
    # AI provider
    echo -e "${BLUE}AI Provider:${NC}"
    echo "1) OpenAI"
    echo "2) Anthropic"
    echo "3) Skip"
    read -p "Choose option (1-3): " ai_choice
    
    case $ai_choice in
        1)
            read -p "Enter OpenAI API Key: " openai_key
            if [ ! -z "$openai_key" ]; then
                echo "Setting OPENAI_API_KEY..."
                npx supabase secrets set OPENAI_API_KEY="$openai_key" --project-ref "$PROJECT_REF"
                echo -e "${GREEN}✓ OPENAI_API_KEY set${NC}"
            fi
            ;;
        2)
            read -p "Enter Anthropic API Key: " anthropic_key
            if [ ! -z "$anthropic_key" ]; then
                echo "Setting ANTHROPIC_API_KEY..."
                npx supabase secrets set ANTHROPIC_API_KEY="$anthropic_key" --project-ref "$PROJECT_REF"
                echo -e "${GREEN}✓ ANTHROPIC_API_KEY set${NC}"
            fi
            ;;
        3)
            echo "Skipping AI provider configuration"
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}Configuration complete!${NC}"
    echo ""
    echo "To view all secrets:"
    echo "npx supabase secrets list --project-ref $PROJECT_REF"
fi

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Verify secrets are set correctly"
echo "2. Deploy Edge Functions: ./deploy-edge-functions.sh"
echo "3. Configure cron jobs (see DEPLOYMENT_GUIDE.md)"
echo "4. Test Edge Functions"
