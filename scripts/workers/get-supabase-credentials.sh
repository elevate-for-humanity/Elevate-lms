#!/usr/bin/env bash
# Worker Task: Get Supabase Credentials
# This script guides a human worker through getting Supabase credentials

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 WORKER TASK: Get Supabase Credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This task will guide you through getting your Supabase credentials."
echo ""

# Check if credentials already exist
if [ -f .env.local ]; then
  source .env.local 2>/dev/null || true
  if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ "$NEXT_PUBLIC_SUPABASE_URL" != "https://cuxzzpsyufcewtmicszk.supabase.co" ]; then
    echo "✅ Supabase credentials already configured in .env.local"
    echo ""
    echo "Current values:"
    echo "  NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:40}..."
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:40}..."
    echo "  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:40}..."
    echo ""
    read -p "Do you want to update these? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Keeping existing credentials."
      exit 0
    fi
  fi
fi

echo "📋 STEP-BY-STEP INSTRUCTIONS:"
echo ""
echo "1️⃣  Go to: https://supabase.com/dashboard"
echo ""
echo "2️⃣  If you don't have an account:"
echo "    • Click 'Sign Up'"
echo "    • Use GitHub, Google, or email"
echo "    • Verify your email"
echo ""
echo "3️⃣  If you don't have a project:"
echo "    • Click 'New Project'"
echo "    • Organization: Select or create one"
echo "    • Name: elevate-lms (or your choice)"
echo "    • Database Password: Generate a strong password (SAVE THIS!)"
echo "    • Region: Choose closest to your users"
echo "    • Click 'Create new project'"
echo "    • Wait 2-3 minutes for setup"
echo ""
echo "4️⃣  Get your credentials:"
echo "    • Click on your project"
echo "    • Go to: Settings (gear icon) → API"
echo "    • You'll see:"
echo "      - Project URL"
echo "      - anon public key"
echo "      - service_role key (click 'Reveal' to see it)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prompt for URL
echo "📝 Enter your Supabase Project URL:"
echo "   (Example: https://abcdefghijklmnop.supabase.co)"
read -p "URL: " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: URL cannot be empty"
  exit 1
fi

# Validate URL format
if [[ ! "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
  echo "⚠️  Warning: URL doesn't match expected format (https://xxx.supabase.co)"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "📝 Enter your Supabase anon (public) key:"
echo "   (Starts with 'eyJ...' - very long string)"
read -p "Anon Key: " SUPABASE_ANON_KEY

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: Anon key cannot be empty"
  exit 1
fi

echo ""
echo "📝 Enter your Supabase service_role key:"
echo "   (Starts with 'eyJ...' - very long string, different from anon key)"
read -p "Service Role Key: " SUPABASE_SERVICE_KEY

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ Error: Service role key cannot be empty"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Credentials collected. Updating .env.local..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update .env.local
if [ -f .env.local ]; then
  # Backup existing file
  cp .env.local .env.local.backup
  
  # Update values using sed
  sed -i "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|g" .env.local
  sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|g" .env.local
  sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY|g" .env.local
  
  echo "✅ Updated .env.local (backup saved as .env.local.backup)"
else
  echo "❌ Error: .env.local not found. Creating new file..."
  cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Other required variables (add your values)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
NEXT_PUBLIC_SITE_URL=https://www.elevateconnectsdirectory.org
RESEND_API_KEY=re_placeholder
EMAIL_FROM=noreply@elevateforhumanity.org
EOF
  echo "✅ Created .env.local with Supabase credentials"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 TASK COMPLETE: Supabase credentials configured"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Run database migrations (see scripts/workers/run-supabase-migrations.sh)"
echo "  2. Get Stripe credentials (see scripts/workers/get-stripe-credentials.sh)"
echo "  3. Get Cloudflare credentials (see scripts/workers/get-cloudflare-credentials.sh)"
echo ""
