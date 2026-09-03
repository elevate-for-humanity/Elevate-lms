#!/bin/bash
# Generate complete .env.local with ALL environment variables

set -e

echo "🔍 Scanning codebase for all environment variables..."

# Extract all env vars from code
grep -rh "process\.env\." app lib components --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | \
  grep -o "process\.env\.[A-Z_]*" | \
  sed 's/process\.env\.//' | \
  sort -u > /tmp/all_env_keys.txt

TOTAL=$(wc -l < /tmp/all_env_keys.txt)
echo "✅ Found $TOTAL unique environment variables"
echo ""

# Backup existing .env.local
if [ -f .env.local ]; then
    BACKUP=".env.local.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env.local "$BACKUP"
    echo "📦 Backed up existing .env.local to $BACKUP"
fi

echo "📝 Generating complete .env.local..."
echo ""

# Start building the new .env.local
cat > .env.local << 'HEADER'
# =============================================================================
# COMPLETE ENVIRONMENT VARIABLES
# =============================================================================
# Auto-generated from codebase scan
# Total Variables: TOTAL_COUNT
# Generated: TIMESTAMP
# =============================================================================

HEADER

# Replace placeholders
sed -i "s/TOTAL_COUNT/$TOTAL/" .env.local
sed -i "s/TIMESTAMP/$(date -u +"%Y-%m-%d %H:%M:%S UTC")/" .env.local

# Function to get value from existing env files
get_value() {
    local key=$1
    local value=""
    
    # Check multiple sources in order of preference
    for file in .env.local.backup.* .env.production .env.careersafe .env.nrf .env.hsi .env.jri .env.partners.example .env.production.example .env.example; do
        if [ -f "$file" ]; then
            value=$(grep "^${key}=" "$file" 2>/dev/null | head -1 | cut -d'=' -f2-)
            if [ ! -z "$value" ]; then
                echo "$value"
                return
            fi
        fi
    done
    
    # Return empty if not found
    echo ""
}

# Group variables by category
echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# SUPABASE - Database & Authentication" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep "SUPABASE" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# SITE CONFIGURATION" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "^NEXT_PUBLIC_SITE|^NEXT_PUBLIC_APP|^NEXT_PUBLIC_BASE|^NODE_ENV" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# AUTHENTICATION" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "NEXTAUTH|AUTH0|AZURE_AD|WORKOS|CLERK" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# PAYMENT PROCESSING" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "STRIPE|AFFIRM|AUTHORIZE_NET|PAYPAL" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# EMAIL SERVICES" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "RESEND|SENDGRID|SMTP|EMAIL|MAILGUN" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# AI & ML SERVICES" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "OPENAI|ANTHROPIC|ELEVENLABS|REPLICATE" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# PARTNER INTEGRATIONS" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "CAREERSAFE|CERTIPORT|MILADY|PEARSON|NRF|HSI" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# TAX & FINANCIAL SERVICES" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "DRAKE|EOS_FINANCIAL|EPS_FINANCIAL|TAX" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# CLOUD SERVICES" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "AWS|AZURE|CLOUDINARY|VERCEL|UPSTASH|REDIS" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# MONITORING & ANALYTICS" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "SENTRY|GA_MEASUREMENT|GOOGLE_ANALYTICS|AMPLITUDE|MIXPANEL|POSTHOG" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# SOCIAL & COMMUNICATION" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "FACEBOOK|TWITTER|LINKEDIN|DISCORD|SLACK|TWILIO|VONAGE" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# FEDERAL & GOVERNMENT APIs" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "SAM_GOV|SAM_API|WIOA|GOVERNMENT" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# HR & WORKFORCE" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "BAMBOOHR|GUSTO|RIPPLING|WORKFORCE" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# CRM & MARKETING" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

for key in $(grep -E "HUBSPOT|SALESFORCE|MARKETO|MAILCHIMP" /tmp/all_env_keys.txt); do
    value=$(get_value "$key")
    echo "${key}=${value}" >> .env.local
done

echo "" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local
echo "# OTHER SERVICES" >> .env.local
echo "# -----------------------------------------------------------------------------" >> .env.local

# Add remaining keys that don't match above categories
while read key; do
    if ! grep -q "^${key}=" .env.local 2>/dev/null; then
        value=$(get_value "$key")
        echo "${key}=${value}" >> .env.local
    fi
done < /tmp/all_env_keys.txt

echo "✅ Generated complete .env.local with $TOTAL variables"
echo ""
echo "📊 Summary:"
SET_COUNT=$(grep -c "=." .env.local || echo "0")
EMPTY_COUNT=$((TOTAL - SET_COUNT))
echo "  ✅ Set: $SET_COUNT"
echo "  ❌ Empty: $EMPTY_COUNT"
echo ""
echo "Run: bash scripts/check-env-status.sh"
