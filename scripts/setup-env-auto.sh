#!/bin/bash
# scripts/setup-env-auto.sh
# Automated environment setup for Gitpod/Codespaces

set -e

# Silent mode for faster startup (set VERBOSE=1 to see output)
if [ -z "$VERBOSE" ]; then
    exec 3>&1
    exec 1>/dev/null 2>&1
else
    echo "🔧 Automated Environment Setup"
    echo "================================"
    echo ""
fi

# Function to check if env var is set
check_env_var() {
    local var_name=$1
    if [ -f .env.local ] && grep -q "^${var_name}=" .env.local; then
        local value=$(grep "^${var_name}=" .env.local | cut -d'=' -f2)
        if [ ! -z "$value" ] && [ "$value" != "your-" ] && [ "$value" != "https://placeholder" ]; then
            return 0
        fi
    fi
    return 1
}

# Check if Supabase is already configured
if check_env_var "NEXT_PUBLIC_SUPABASE_URL" && check_env_var "SUPABASE_SERVICE_ROLE_KEY"; then
    [ ! -z "$VERBOSE" ] && echo "✅ Supabase credentials already configured"
    exit 0
fi

# .env.local exists but credentials are empty/placeholder — still usable for dev.
# Don't block the dev server; Next.js will start and show runtime errors only
# for features that actually need Supabase.
if [ -f .env.local ]; then
    [ ! -z "$VERBOSE" ] && echo "⚠️  .env.local exists but Supabase credentials are empty — starting dev server anyway"
    exit 0
fi

echo "⚠️  Supabase credentials not found in .env.local"
echo ""

# Try Method 1: Vercel CLI
if command -v vercel &> /dev/null; then
    echo "📥 Method 1: Trying Vercel CLI..."
    
    # Check if logged in
    if vercel whoami &> /dev/null; then
        echo "✅ Logged into Vercel"
        
        # Try to pull env vars
        if vercel env pull .env.local --yes 2>/dev/null; then
            echo "✅ Successfully pulled environment variables from Vercel"
            
            # Verify Supabase vars are present
            if check_env_var "NEXT_PUBLIC_SUPABASE_URL"; then
                echo "✅ Supabase credentials found"
                exit 0
            else
                echo "⚠️  Pulled env vars but Supabase credentials not found"
            fi
        else
            echo "⚠️  Could not pull from Vercel (may need to select project)"
        fi
    else
        echo "⚠️  Not logged into Vercel CLI"
    fi
fi

# Method 2: Check if running in Vercel build
if [ ! -z "$VERCEL" ]; then
    echo "📥 Method 2: Running in Vercel environment"
    
    if [ ! -z "$NEXT_PUBLIC_SUPABASE_URL" ] && [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "✅ Supabase credentials available from Vercel environment"
        
        # Create .env.local from Vercel env vars
        cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
EOF
        
        echo "✅ Created .env.local from Vercel environment"
        exit 0
    fi
fi

# Method 3: Manual instructions
echo ""
echo "❌ Could not automatically retrieve Supabase credentials"
echo ""
echo "📝 Manual Setup Required:"
echo ""
echo "Option A: Use Vercel CLI"
echo "  1. Install: npm install -g vercel"
echo "  2. Login: vercel login"
echo "  3. Pull env: vercel env pull .env.local"
echo ""
echo "Option B: Manual Copy"
echo "  1. Go to: https://vercel.com/dashboard"
echo "  2. Select your project"
echo "  3. Go to: Settings → Environment Variables"
echo "  4. Copy these three values:"
echo "     - NEXT_PUBLIC_SUPABASE_URL"
echo "     - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "     - SUPABASE_SERVICE_ROLE_KEY"
echo "  5. Create .env.local with those values"
echo ""

exit 1
