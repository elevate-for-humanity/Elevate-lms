#!/usr/bin/env bash
set -e

echo "🔧 Setting up environment variables..."
echo ""

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled. Keeping existing .env.local"
        exit 0
    fi
fi

# Supabase project info
SUPABASE_URL="https://cuxzzpsyufcewtmicszk.supabase.co"
SUPABASE_PROJECT_REF="cuxzzpsyufcewtmicszk"

echo "📍 Supabase Project: $SUPABASE_URL"
echo "📍 Project Reference: $SUPABASE_PROJECT_REF"
echo ""
echo "🔑 You need to get your API keys from:"
echo "   https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/settings/api"
echo ""

# Prompt for keys
read -p "Enter your SUPABASE_ANON_KEY (starts with eyJhbGci...): " ANON_KEY
echo ""
read -p "Enter your SUPABASE_SERVICE_ROLE_KEY (starts with eyJhbGci...): " SERVICE_KEY
echo ""

# Validate keys
if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ Error: Both keys are required"
    exit 1
fi

if [[ ! $ANON_KEY =~ ^eyJ ]]; then
    echo "⚠️  Warning: Anon key doesn't look like a JWT token"
fi

if [[ ! $SERVICE_KEY =~ ^eyJ ]]; then
    echo "⚠️  Warning: Service role key doesn't look like a JWT token"
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

# Email (Optional - for notifications)
RESEND_API_KEY=
EMAIL_FROM=noreply@elevate4humanityedu.org

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-EFHWORKFORCE01
EOF

echo "✅ .env.local created successfully!"
echo ""
echo "📝 Configuration:"
echo "   - Supabase URL: $SUPABASE_URL"
echo "   - Anon Key: ${ANON_KEY:0:20}..."
echo "   - Service Key: ${SERVICE_KEY:0:20}..."
echo ""
echo "🚀 You can now start the development server:"
echo "   npm run dev"
echo ""
echo "⚠️  Remember: Never commit .env.local to git!"
