#!/bin/bash
# Setup environment variables based on current git branch
# This ensures .env.local is never committed and always branch-specific

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Environment Setup by Branch${NC}"
echo ""

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
echo -e "${BLUE}Current branch:${NC} ${GREEN}${CURRENT_BRANCH}${NC}"

# Define environment file based on branch
ENV_FILE=".env.local"
BRANCH_ENV_DIR=".env-branches"
BRANCH_ENV_FILE="${BRANCH_ENV_DIR}/${CURRENT_BRANCH}.env"

# Create branch env directory if it doesn't exist
mkdir -p "${BRANCH_ENV_DIR}"

# Ensure .env-branches is in .gitignore
if ! grep -q "^.env-branches/" .gitignore 2>/dev/null; then
    echo ".env-branches/" >> .gitignore
    echo -e "${GREEN}✅ Added .env-branches/ to .gitignore${NC}"
fi

# Function to organize env variables
organize_env_file() {
    local input_file=$1
    local output_file=$2
    
    echo -e "${YELLOW}📋 Organizing environment variables...${NC}"
    
    cat > "${output_file}" << 'EOF'
# =============================================================================
# ENVIRONMENT VARIABLES - Auto-organized by branch
# =============================================================================
# Branch: BRANCH_NAME
# Generated: TIMESTAMP
# =============================================================================

# -----------------------------------------------------------------------------
# SUPABASE - Database & Authentication
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# -----------------------------------------------------------------------------
# SITE CONFIGURATION
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Elevate For Humanity
NEXT_PUBLIC_ORGANIZATION_NAME=Elevate for Humanity Career and Technical Institute
NODE_ENV=development

# -----------------------------------------------------------------------------
# AUTHENTICATION
# -----------------------------------------------------------------------------
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# -----------------------------------------------------------------------------
# STRIPE - Payment Processing
# -----------------------------------------------------------------------------
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STUDENT=
STRIPE_PRICE_CAREER=

# -----------------------------------------------------------------------------
# AFFIRM - Alternative Payment
# -----------------------------------------------------------------------------
AFFIRM_PUBLIC_KEY=
AFFIRM_PRIVATE_KEY=
NEXT_PUBLIC_AFFIRM_PUBLIC_KEY=

# -----------------------------------------------------------------------------
# EMAIL - Resend
# -----------------------------------------------------------------------------
RESEND_API_KEY=
EMAIL_FROM=noreply@elevateforhumanity.org
NOTIFY_EMAIL_TO=admin@elevateforhumanity.org
NOTIFY_EMAIL_FROM=noreply@elevateforhumanity.org

# -----------------------------------------------------------------------------
# SMTP (Alternative Email)
# -----------------------------------------------------------------------------
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# -----------------------------------------------------------------------------
# AI SERVICES
# -----------------------------------------------------------------------------
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# -----------------------------------------------------------------------------
# REDIS - Caching & Rate Limiting
# -----------------------------------------------------------------------------
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# -----------------------------------------------------------------------------
# MONITORING & ANALYTICS
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# -----------------------------------------------------------------------------
# WORKOS - Enterprise SSO
# -----------------------------------------------------------------------------
WORKOS_API_KEY=
WORKOS_CLIENT_ID=

# -----------------------------------------------------------------------------
# VERCEL
# -----------------------------------------------------------------------------
VERCEL_TOKEN=
VERCEL_PROJECT_ID=

# -----------------------------------------------------------------------------
# AUTOPILOT
# -----------------------------------------------------------------------------
AUTOPILOT_SECRET=

# -----------------------------------------------------------------------------
# POSTGRES (Direct Connection)
# -----------------------------------------------------------------------------
POSTGRES_URL=
POSTGRES_PASSWORD=

EOF

    # Replace placeholders
    sed -i "s/BRANCH_NAME/${CURRENT_BRANCH}/g" "${output_file}"
    sed -i "s/TIMESTAMP/$(date -u +"%Y-%m-%d %H:%M:%S UTC")/g" "${output_file}"
    
    # If input file exists, merge values
    if [ -f "${input_file}" ]; then
        echo -e "${YELLOW}📥 Merging existing values...${NC}"
        
        # Read existing values and update organized file
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            if [[ $key =~ ^[[:space:]]*# ]] || [[ -z $key ]]; then
                continue
            fi
            
            # Remove leading/trailing whitespace
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs)
            
            # Update value in organized file if key exists
            if grep -q "^${key}=" "${output_file}"; then
                # Escape special characters in value
                escaped_value=$(echo "$value" | sed 's/[&/\]/\\&/g')
                sed -i "s|^${key}=.*|${key}=${escaped_value}|g" "${output_file}"
            fi
        done < "${input_file}"
    fi
    
    echo -e "${GREEN}✅ Environment file organized${NC}"
}

# Check if branch-specific env exists
if [ -f "${BRANCH_ENV_FILE}" ]; then
    echo -e "${GREEN}✅ Found branch-specific environment file${NC}"
    echo -e "${BLUE}   ${BRANCH_ENV_FILE}${NC}"
    
    # Copy to .env.local
    cp "${BRANCH_ENV_FILE}" "${ENV_FILE}"
    echo -e "${GREEN}✅ Loaded environment for branch: ${CURRENT_BRANCH}${NC}"
else
    echo -e "${YELLOW}⚠️  No branch-specific environment found${NC}"
    
    # Check if .env.local exists
    if [ -f "${ENV_FILE}" ]; then
        echo -e "${YELLOW}📋 Organizing existing .env.local...${NC}"
        
        # Backup current .env.local
        cp "${ENV_FILE}" "${ENV_FILE}.backup"
        
        # Organize and save to branch-specific file
        organize_env_file "${ENV_FILE}" "${BRANCH_ENV_FILE}"
        
        # Copy organized version to .env.local
        cp "${BRANCH_ENV_FILE}" "${ENV_FILE}"
        
        echo -e "${GREEN}✅ Created branch-specific environment${NC}"
        echo -e "${BLUE}   Saved to: ${BRANCH_ENV_FILE}${NC}"
        echo -e "${BLUE}   Backup: ${ENV_FILE}.backup${NC}"
    else
        # Create new organized template
        echo -e "${YELLOW}📝 Creating new environment template...${NC}"
        
        # Check if .env.local.real exists
        if [ -f ".env.local.real" ]; then
            organize_env_file ".env.local.real" "${BRANCH_ENV_FILE}"
        else
            organize_env_file ".env.example" "${BRANCH_ENV_FILE}"
        fi
        
        # Copy to .env.local
        cp "${BRANCH_ENV_FILE}" "${ENV_FILE}"
        
        echo -e "${GREEN}✅ Created new environment file${NC}"
        echo -e "${BLUE}   ${BRANCH_ENV_FILE}${NC}"
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Environment setup complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Edit ${ENV_FILE} with your API keys"
echo -e "   2. Changes are automatically saved to ${BRANCH_ENV_FILE}"
echo -e "   3. Switch branches with: git checkout <branch>"
echo -e "   4. Run this script again to load branch-specific env"
echo ""
echo -e "${BLUE}💡 Tip:${NC} Add this to your git hooks for automatic switching!"
echo ""
