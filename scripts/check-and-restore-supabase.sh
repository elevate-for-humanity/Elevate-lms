#!/usr/bin/env bash
# Check Supabase Status and Guide Restoration
# This script checks if Supabase is accessible and provides next steps

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_step() { echo -e "${CYAN}🚀 $1${NC}"; }
log_bold() { echo -e "${BOLD}$1${NC}"; }

clear
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         SUPABASE PROJECT STATUS CHECKER                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

SUPABASE_URL="https://cuxzzpsyufcewtmicszk.supabase.co"
SUPABASE_ANON_KEY="process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY"

log_step "Testing Supabase Connection..."
echo ""
log_info "Project URL: $SUPABASE_URL"
log_info "Project Ref: cuxzzpsyufcewtmicszk"
echo ""

# Test connection
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 \
  "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" 2>/dev/null || echo "000")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ "$HTTP_CODE" == "200" ]]; then
  log_success "PROJECT IS ACTIVE! ✨"
  echo ""
  log_info "Your Supabase project is running and accessible."
  echo ""
  log_step "Next Step: Apply Migrations"
  echo ""
  echo "You have 2 options:"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_bold "Option 1: Supabase Dashboard (Easiest - 5 minutes)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "1. Open: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk"
  echo ""
  echo "2. Go to: SQL Editor → New Query"
  echo ""
  echo "3. Apply migrations in order:"
  echo "   a) Copy: supabase/migrations/001_initial_schema.sql"
  echo "      Paste and click 'Run'"
  echo ""
  echo "   b) Copy: supabase/migrations/002_lms_schema.sql"
  echo "      Paste and click 'Run'"
  echo ""
  echo "   c) Copy: supabase/migrations/003_lms_seed_data.sql"
  echo "      Paste and click 'Run'"
  echo ""
  echo "   d) Copy: supabase/migrations/004_add_missing_rls_policies.sql"
  echo "      Paste and click 'Run' ⭐ NEW RLS POLICIES"
  echo ""
  echo "4. Verify: Go to 'Table Editor' - you should see all tables"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_bold "Option 2: Supabase CLI (Fastest - 2 minutes)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Run these commands:"
  echo ""
  echo "  # Install Supabase CLI (if not installed)"
  echo "  npm install -g supabase"
  echo ""
  echo "  # Login (opens browser)"
  echo "  supabase login"
  echo ""
  echo "  # Link your project"
  echo "  supabase link --project-ref cuxzzpsyufcewtmicszk"
  echo ""
  echo "  # Apply all migrations automatically"
  echo "  supabase db push"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  log_step "After Migrations: Run Autopilot"
  echo ""
  echo "Once migrations are applied, run:"
  echo ""
  echo "  ./scripts/autopilot-complete-deployment.sh"
  echo ""
  echo "This will automatically:"
  echo "  ✅ Build your application"
  echo "  ✅ Deploy to Cloudflare Pages"
  echo "  ✅ Set GitHub secrets"
  echo "  ✅ Commit and push changes"
  echo ""
  
elif [[ "$HTTP_CODE" == "404" ]] || [[ "$HTTP_CODE" == "000" ]]; then
  log_error "PROJECT IS NOT ACCESSIBLE"
  echo ""
  log_warning "HTTP Status: $HTTP_CODE (Connection failed or project not found)"
  echo ""
  log_info "Your Supabase project is either:"
  echo "  • Paused (inactive for 7+ days)"
  echo "  • Deleted"
  echo "  • Never fully created"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_bold "Solution 1: Restore Paused Project (If it exists)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "1. Go to: https://supabase.com/dashboard"
  echo ""
  echo "2. Look for project: cuxzzpsyufcewtmicszk"
  echo ""
  echo "3. If you see 'Paused' status:"
  echo "   • Click 'Restore' or 'Resume'"
  echo "   • Wait 2-3 minutes for it to wake up"
  echo "   • Run this script again to verify"
  echo ""
  echo "4. Then apply migrations (see instructions above)"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_bold "Solution 2: Create New Project (If it doesn't exist)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "1. Go to: https://supabase.com/dashboard"
  echo ""
  echo "2. Click: 'New Project'"
  echo "   • Name: elevate-lms"
  echo "   • Database Password: (create strong password)"
  echo "   • Region: us-east-1 (or closest)"
  echo "   • Plan: Free"
  echo "   • Click 'Create new project'"
  echo "   • Wait 2-3 minutes..."
  echo ""
  echo "3. Get your credentials:"
  echo "   • Go to: Settings → API"
  echo "   • Copy:"
  echo "     - Project URL"
  echo "     - anon public key"
  echo "     - service_role key"
  echo ""
  echo "4. Update your code:"
  echo "   • Edit: src/supabaseClient.js"
  echo "   • Replace URL and key with new values"
  echo ""
  echo "5. Update .env file:"
  echo "   VITE_SUPABASE_URL=https://your-new-project.supabase.co"
  echo "   VITE_SUPABASE_ANON_KEY=your-new-anon-key"
  echo ""
  echo "6. Update GitHub secrets:"
  echo "   gh secret set VITE_SUPABASE_URL -b'your-new-url'"
  echo "   gh secret set VITE_SUPABASE_ANON_KEY -b'your-new-key'"
  echo ""
  echo "7. Apply migrations (see Option 1 or 2 above)"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  log_info "💡 Tip: Free tier is perfect for this project!"
  echo "   • 500 MB database"
  echo "   • 50,000 monthly active users"
  echo "   • Unlimited API requests"
  echo ""
  
else
  log_warning "UNEXPECTED RESPONSE"
  echo ""
  log_info "HTTP Status: $HTTP_CODE"
  echo ""
  log_info "The project might be having issues."
  echo "Check: https://status.supabase.com/"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "📚 Documentation:"
echo "   • Full guide: SUPABASE_STATUS.md"
echo "   • RLS policies: supabase/RLS_POLICIES.md"
echo "   • Setup guide: supabase/README.md"
echo ""
log_info "🆘 Need help?"
echo "   • Supabase Docs: https://supabase.com/docs"
echo "   • Discord: https://discord.supabase.com"
echo ""
