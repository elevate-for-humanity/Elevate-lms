#!/bin/bash
# Application Fee Webhook Setup Script
#
# This script sets up the Stripe webhook for application fee payments.
# 
# Run this ONCE after deployment to verify/reate the webhook.
#
# Usage: ./scripts/setup-application-fee-webhook.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "Application Fee Webhook Setup"
echo "=============================================="

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}Stripe CLI not found.${NC}"
    echo "Install from: https://stripe.com/docs/stripe-cli"
    echo ""
    echo "Or use Stripe Dashboard:"
    echo "  1. Go to https://dashboard.stripe.com/webhooks"
    echo "  2. Add endpoint:"
    echo "     URL: https://www.elevateforhumanity.org/api/application-fee/webhook"
    echo "  3. Select events:"
    echo "     - checkout.session.completed"
    echo "     - charge.refunded"
    exit 1
fi

# Get the webhook secret
STRIPE_WEBHOOK_SECRET=$(stripe webhooks endpoints create \
  --url "https://www.elevateforhumanity.org/api/application-fee/webhook" \
  --enabled-events "checkout.session.completed" \
  --enabled-events "charge.refunded" \
  2>/dev/null | grep "secret" | awk '{print $2}')

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}Webhook may already exist. Checking...${NC}"
    
    # List existing webhooks
    echo ""
    echo "Existing application-fee webhooks:"
    stripe webhooks endpoints list \
      --limit 10 \
      --expand "data.enabled_events" \
      2>/dev/null | grep -A5 "api/application-fee" || echo "No webhook found"
    
    echo ""
    echo -e "${RED}Please manually verify in Stripe Dashboard:${NC}"
    echo "  https://dashboard.stripe.com/webhooks"
else
    echo -e "${GREEN}Webhook created successfully!${NC}"
    echo ""
    echo "Add this to your .env:"
    echo "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
fi

echo ""
echo "=============================================="
echo "Webhook Details"
echo "=============================================="
echo "URL: https://www.elevateforhumanity.org/api/application-fee/webhook"
echo ""
echo "Events handled:"
echo "  - checkout.session.completed"
echo "  - charge.refunded"
echo ""
echo "Fee Policy:"
echo "  - Programs: \$15 fee required"
echo "  - Host Shops: \$15 fee required"
echo "  - Apprenticeships: \$0 NO FEE"
