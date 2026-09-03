#!/usr/bin/env bash
# Supabase Autopilot - One Command Setup
# Attempts to connect to existing project or guides through new setup

set -euo pipefail

echo "🤖 SUPABASE AUTOPILOT"
echo "====================="
echo ""

# Try existing credentials first
EXISTING_URL="https://cuxzzpsyufcewtmicszk.supabase.co"
EXISTING_KEY="process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY"

echo "🔍 Checking existing Supabase project..."
echo "   URL: ${EXISTING_URL}"

# Test connection
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${EXISTING_URL}/rest/v1/" \
  -H "apikey: ${EXISTING_KEY}" \
  -H "Authorization: Bearer ${EXISTING_KEY}" 2>/dev/null || echo "000")

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "   ✅ Existing project is ACTIVE!"
  echo ""
  echo "🎉 Great news! Your Supabase project is working."
  echo ""
  echo "Using existing credentials:"
  echo "   URL: ${EXISTING_URL}"
  echo "   Key: ${EXISTING_KEY:0:20}..."
  echo ""
  
  # Use existing credentials
  export SUPABASE_URL="${EXISTING_URL}"
  export SUPABASE_ANON_KEY="${EXISTING_KEY}"
  export SUPABASE_SERVICE_KEY="${EXISTING_KEY}"  # Will need real service key later
  
  echo "⚠️  Note: Using anon key as service key (limited permissions)"
  echo "   For full functionality, you'll need the service_role key from:"
  echo "   https://supabase.com/dashboard → Settings → API"
  echo ""
  
  # Run setup
  ./scripts/setup-supabase.sh
  
elif [[ "$HTTP_CODE" == "404" ]] || [[ "$HTTP_CODE" == "000" ]]; then
  echo "   ❌ Project is NOT accessible (HTTP $HTTP_CODE)"
  echo ""
  echo "The project is either:"
  echo "   • Paused (inactive for 7+ days)"
  echo "   • Deleted"
  echo "   • Never created"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 MANUAL SETUP REQUIRED (Takes 3 minutes)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Step 1: Open Supabase Dashboard"
  echo "   👉 https://supabase.com/dashboard"
  echo ""
  echo "Step 2: Create New Project"
  echo "   • Click 'New Project'"
  echo "   • Name: elevate-lms"
  echo "   • Database Password: (create strong password)"
  echo "   • Region: us-east-1 (or closest to you)"
  echo "   • Plan: FREE"
  echo "   • Click 'Create new project'"
  echo "   • Wait 2-3 minutes..."
  echo ""
  echo "Step 3: Get Your Credentials"
  echo "   • Click 'Settings' (gear icon)"
  echo "   • Click 'API'"
  echo "   • Copy these 3 values:"
  echo ""
  echo "     Project URL: https://xxxxxxxxxxxxx.supabase.co"
  echo "     anon public: eyJhbGci..."
  echo "     service_role: eyJhbGci..."
  echo ""
  echo "Step 4: Run Setup"
  echo "   export SUPABASE_URL='https://xxxxxxxxxxxxx.supabase.co'"
  echo "   export SUPABASE_ANON_KEY='eyJhbGci...'"
  echo "   export SUPABASE_SERVICE_KEY='eyJhbGci...'"
  echo "   ./scripts/setup-supabase.sh"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "💡 Tip: The free tier is perfect for this project!"
  echo "   • 500 MB database (you'll use <1 MB)"
  echo "   • 50,000 users (you'll have <100)"
  echo "   • Unlimited API requests"
  echo ""
  echo "📖 Full guide: See SUPABASE-SETUP.md"
  
else
  echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
  echo "   The project might be having issues."
  echo ""
  echo "Please check: https://status.supabase.com/"
fi

echo ""
echo "Need help? Check SUPABASE-SETUP.md for detailed instructions."
