#!/bin/bash
# Environment Variables Verification Script
# Verifies all required environment variables are present and valid

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL=0
PRESENT=0
MISSING=0
INVALID=0

# Arrays to track status
declare -a MISSING_VARS=()
declare -a INVALID_VARS=()
declare -a PRESENT_VARS=()

log_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

log_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo "───────────────────────────────────────────────────────────"
}

check_var() {
    local var_name="$1"
    local var_value="${!var_name:-}"
    local required="${2:-true}"
    local validation="${3:-}"
    
    TOTAL=$((TOTAL + 1))
    
    if [ -z "$var_value" ]; then
        if [ "$required" = "true" ]; then
            echo -e "  ${RED}✖${NC} $var_name - ${RED}MISSING${NC}"
            MISSING=$((MISSING + 1))
            MISSING_VARS+=("$var_name")
        else
            echo -e "  ${YELLOW}○${NC} $var_name - ${YELLOW}OPTIONAL (not set)${NC}"
        fi
        return 1
    fi
    
    # Validate if validation function provided
    if [ -n "$validation" ]; then
        if ! $validation "$var_value"; then
            echo -e "  ${RED}✖${NC} $var_name - ${RED}INVALID${NC}"
            INVALID=$((INVALID + 1))
            INVALID_VARS+=("$var_name")
            return 1
        fi
    fi
    
    # Mask sensitive values
    local display_value="$var_value"
    if [[ "$var_name" =~ (KEY|SECRET|TOKEN|PASSWORD) ]]; then
        display_value="${var_value:0:10}...${var_value: -4}"
    fi
    
    echo -e "  ${GREEN}✓${NC} $var_name - ${GREEN}OK${NC} ($display_value)"
    PRESENT=$((PRESENT + 1))
    PRESENT_VARS+=("$var_name")
    return 0
}

validate_url() {
    local url="$1"
    if [[ "$url" =~ ^https?:// ]]; then
        return 0
    fi
    return 1
}

validate_email() {
    local email="$1"
    if [[ "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    fi
    return 1
}

validate_uuid() {
    local uuid="$1"
    if [[ "$uuid" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
        return 0
    fi
    return 1
}

# Main verification
main() {
    log_header "Environment Variables Verification"
    echo "Checking all required environment variables..."
    echo ""
    
    # Supabase Configuration
    log_section "Supabase Configuration"
    check_var "VITE_SUPABASE_URL" true validate_url
    check_var "VITE_SUPABASE_ANON_KEY" true
    check_var "SUPABASE_SERVICE_KEY" true
    check_var "SUPABASE_JWT_SECRET" true
    check_var "SUPABASE_DB_PASSWORD" false
    
    # Cloudflare Configuration
    log_section "Cloudflare Configuration"
    check_var "CLOUDFLARE_API_TOKEN" true
    check_var "CLOUDFLARE_ACCOUNT_ID" true
    check_var "CLOUDFLARE_ZONE_ID" false
    check_var "CF_API_TOKEN" false
    check_var "CF_ACCOUNT_ID" false
    
    # Cloudflare Workers
    log_section "Cloudflare Workers"
    check_var "ORCHESTRATOR_URL" false validate_url
    check_var "ANALYZER_URL" false validate_url
    check_var "AGENT_WORKER_URL" false validate_url
    check_var "AI_STYLIST_URL" false validate_url
    
    # Render Configuration
    log_section "Render Configuration"
    check_var "RENDER_API_KEY" false
    check_var "RENDER_SERVICE_ID" false
    check_var "RENDER_DEPLOY_HOOK" false validate_url
    check_var "FRONTEND_URL" false validate_url
    
    # Google Configuration
    log_section "Google Configuration"
    check_var "GOOGLE_OAUTH_CLIENT_ID" false
    check_var "GOOGLE_OAUTH_CLIENT_SECRET" false
    check_var "GOOGLE_SA_JSON_B64" false
    check_var "GOOGLE_IMPERSONATE_EMAIL" false validate_email
    
    # JWT & Authentication
    log_section "JWT & Authentication"
    check_var "JWT_SECRET" true
    
    # Email Configuration
    log_section "Email Configuration"
    check_var "MAIL_FROM" false validate_email
    check_var "MAIL_FROM_NAME" false
    check_var "MAIL_BCC" false validate_email
    
    # Application Configuration
    log_section "Application Configuration"
    check_var "NODE_ENV" false
    check_var "PORT" false
    check_var "SITE_TITLE" false
    check_var "SERVICE_TOKEN" false
    
    # Analytics
    log_section "Analytics & Monitoring"
    check_var "VITE_GA_MEASUREMENT_ID" false
    check_var "VITE_GTM_ID" false
    check_var "VITE_FACEBOOK_PIXEL_ID" false
    check_var "VITE_HOTJAR_ID" false
    check_var "SENTRY_DSN" false validate_url
    check_var "GOOGLE_ANALYTICS_ID" false
    
    # Stripe (Optional)
    log_section "Stripe (Optional)"
    check_var "STRIPE_SECRET_KEY" false
    check_var "STRIPE_PUBLISHABLE_KEY" false
    check_var "VITE_STRIPE_PUBLISHABLE_KEY" false
    check_var "STRIPE_WEBHOOK_SECRET" false
    
    # Summary
    echo ""
    log_header "Verification Summary"
    echo ""
    echo -e "  Total Variables Checked: ${BLUE}$TOTAL${NC}"
    echo -e "  Present & Valid:         ${GREEN}$PRESENT${NC}"
    echo -e "  Missing (Required):      ${RED}$MISSING${NC}"
    echo -e "  Invalid:                 ${RED}$INVALID${NC}"
    echo ""
    
    # Missing variables
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo -e "${RED}Missing Required Variables:${NC}"
        for var in "${MISSING_VARS[@]}"; do
            echo -e "  ${RED}✖${NC} $var"
        done
        echo ""
    fi
    
    # Invalid variables
    if [ ${#INVALID_VARS[@]} -gt 0 ]; then
        echo -e "${RED}Invalid Variables:${NC}"
        for var in "${INVALID_VARS[@]}"; do
            echo -e "  ${RED}✖${NC} $var"
        done
        echo ""
    fi
    
    # Recommendations
    if [ $MISSING -gt 0 ] || [ $INVALID -gt 0 ]; then
        echo -e "${YELLOW}Recommendations:${NC}"
        echo ""
        
        if [ ${#MISSING_VARS[@]} -gt 0 ]; then
            echo "1. Set missing required variables:"
            echo "   Copy .env.example to .env and fill in values:"
            echo "   cp .env.example .env"
            echo ""
            
            for var in "${MISSING_VARS[@]}"; do
                case "$var" in
                    VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|SUPABASE_SERVICE_KEY|SUPABASE_JWT_SECRET)
                        echo "   # Get from: https://app.supabase.com/project/_/settings/api"
                        ;;
                    CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)
                        echo "   # Get from: https://dash.cloudflare.com/profile/api-tokens"
                        ;;
                    JWT_SECRET)
                        echo "   # Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
                        ;;
                esac
            done
            echo ""
        fi
        
        if [ ${#INVALID_VARS[@]} -gt 0 ]; then
            echo "2. Fix invalid variables:"
            for var in "${INVALID_VARS[@]}"; do
                echo "   - $var: Check format and value"
            done
            echo ""
        fi
        
        echo "3. Add variables to Netlify:"
        echo "   https://app.netlify.com → Site settings → Environment variables"
        echo ""
        
        echo "4. Restart development server after setting variables"
        echo ""
    else
        echo -e "${GREEN}✓ All required environment variables are present and valid!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Ensure variables are added to Netlify dashboard"
        echo "  2. Run: npm run build"
        echo "  3. Deploy to production"
        echo ""
    fi
    
    # Exit code
    if [ $MISSING -gt 0 ] || [ $INVALID -gt 0 ]; then
        exit 1
    fi
    
    exit 0
}

# Run main
main "$@"
