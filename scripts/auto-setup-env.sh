#!/usr/bin/env bash
set -e

echo "🤖 Auto-setup environment from GitHub Secrets or manual input..."
echo ""

SUPABASE_URL="https://cuxzzpsyufcewtmicszk.supabase.co"

# Check if running in GitHub Actions
if [ -n "$GITHUB_ACTIONS" ]; then
    echo "🔍 Running in GitHub Actions, using secrets..."
    
    if [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "❌ Error: GitHub Secrets not set"
        echo "   Add SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to GitHub Secrets"
        exit 1
    fi
    
    ANON_KEY="$SUPABASE_ANON_KEY"
    SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    
elif [ -f .env.local ]; then
    echo "✅ .env.local already exists, skipping setup"
    exit 0
    
else
    echo "📋 Manual setup required"
    echo ""
    echo "🔑 Get your keys from:"
    echo "   https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/settings/api"
    echo ""
    echo "Option 1: Run the interactive setup:"
    echo "   bash scripts/setup-env.sh"
    echo ""
    echo "Option 2: Create .env.local manually:"
    echo "   cp .env.local.example .env.local"
    echo "   # Then edit .env.local with your keys"
    echo ""
    exit 1
fi

# Create .env.local
cat > .env.local << EOF
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://www.elevate4humanityedu.org
NEXT_PUBLIC_APP_URL=https://www.elevate4humanityedu.org

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY

# Email (Optional)
RESEND_API_KEY=${RESEND_API_KEY:-}
EMAIL_FROM=noreply@elevate4humanityedu.org

# Stripe (Optional)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY:-}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-}

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-EFHWORKFORCE01
EOF

echo "✅ .env.local created from GitHub Secrets!"
