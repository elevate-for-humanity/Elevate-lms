#!/usr/bin/env bash
# Interactive Migration Application Script
# Guides user through applying Supabase migrations

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
echo "║         SUPABASE MIGRATION APPLICATION WIZARD              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

log_info "This wizard will help you apply Supabase migrations."
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
  log_success "Supabase CLI is installed"
  HAS_CLI=true
else
  log_warning "Supabase CLI is not installed"
  HAS_CLI=false
fi

echo ""
log_step "Choose your migration method:"
echo ""
echo "1) Supabase CLI (Fastest - automatic)"
echo "2) Supabase Dashboard (Manual - copy/paste SQL)"
echo "3) Show migration files (to copy manually)"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    if [ "$HAS_CLI" = false ]; then
      echo ""
      log_warning "Supabase CLI is not installed."
      echo ""
      read -p "Install it now? (y/n): " install_choice
      if [[ $install_choice =~ ^[Yy]$ ]]; then
        log_info "Installing Supabase CLI..."
        npm install -g supabase
        log_success "Supabase CLI installed"
      else
        log_error "Cannot proceed without Supabase CLI"
        exit 1
      fi
    fi
    
    echo ""
    log_step "Using Supabase CLI Method"
    echo ""
    
    # Check if already logged in
    if supabase projects list &> /dev/null; then
      log_success "Already logged in to Supabase"
    else
      log_info "You need to login to Supabase..."
      echo ""
      read -p "Press Enter to open browser for login..."
      supabase login
    fi
    
    echo ""
    log_info "Linking to project: cuxzzpsyufcewtmicszk"
    
    if supabase link --project-ref cuxzzpsyufcewtmicszk; then
      log_success "Project linked successfully"
      echo ""
      log_info "Applying migrations..."
      echo ""
      
      if supabase db push; then
        log_success "All migrations applied successfully! 🎉"
        echo ""
        log_info "Your database is now ready with:"
        echo "  ✅ All tables created"
        echo "  ✅ RLS policies applied"
        echo "  ✅ Sample data loaded"
        echo ""
        log_step "Next: Run autopilot deployment"
        echo ""
        echo "  ./scripts/autopilot-complete-deployment.sh"
        echo ""
      else
        log_error "Migration failed"
        log_info "Try the Dashboard method instead (option 2)"
      fi
    else
      log_error "Could not link to project"
      log_info "The project might be paused or deleted."
      log_info "Run: ./scripts/check-and-restore-supabase.sh"
    fi
    ;;
    
  2)
    echo ""
    log_step "Using Supabase Dashboard Method"
    echo ""
    log_info "Follow these steps:"
    echo ""
    echo "1. Open: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql"
    echo ""
    echo "2. Click: 'New Query'"
    echo ""
    echo "3. Apply migrations in this order:"
    echo ""
    
    migrations=(
      "001_initial_schema.sql|Creates profiles table with RLS"
      "002_lms_schema.sql|Creates LMS tables (courses, modules, etc.)"
      "003_lms_seed_data.sql|Adds sample course data"
      "004_add_missing_rls_policies.sql|⭐ NEW: Comprehensive RLS policies"
    )
    
    for i in "${!migrations[@]}"; do
      IFS='|' read -r file desc <<< "${migrations[$i]}"
      num=$((i + 1))
      echo "   ${num}) File: supabase/migrations/${file}"
      echo "      ${desc}"
      echo ""
      echo "      • Copy the file contents"
      echo "      • Paste in SQL Editor"
      echo "      • Click 'Run'"
      echo "      • Wait for success message"
      echo ""
    done
    
    echo "4. Verify: Go to 'Table Editor' - you should see all tables"
    echo ""
    read -p "Press Enter when you've completed all migrations..."
    echo ""
    log_success "Great! Your migrations should be applied."
    echo ""
    log_step "Next: Run autopilot deployment"
    echo ""
    echo "  ./scripts/autopilot-complete-deployment.sh"
    echo ""
    ;;
    
  3)
    echo ""
    log_step "Migration Files Location"
    echo ""
    log_info "All migration files are in: supabase/migrations/"
    echo ""
    
    for file in supabase/migrations/*.sql; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        size=$(wc -l < "$file")
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_bold "File: $filename"
        log_info "Lines: $size"
        echo ""
        echo "Preview (first 10 lines):"
        echo ""
        head -10 "$file" | sed 's/^/  /'
        echo ""
        echo "  ... (see full file for complete SQL)"
        echo ""
      fi
    done
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    log_info "To view full files:"
    echo "  cat supabase/migrations/001_initial_schema.sql"
    echo "  cat supabase/migrations/002_lms_schema.sql"
    echo "  cat supabase/migrations/003_lms_seed_data.sql"
    echo "  cat supabase/migrations/004_add_missing_rls_policies.sql"
    echo ""
    ;;
    
  4)
    echo ""
    log_info "Exiting..."
    exit 0
    ;;
    
  *)
    log_error "Invalid choice"
    exit 1
    ;;
esac

echo ""
log_info "📚 Additional Resources:"
echo "   • Check project status: ./scripts/check-and-restore-supabase.sh"
echo "   • RLS documentation: supabase/RLS_POLICIES.md"
echo "   • Full status report: SUPABASE_STATUS.md"
echo ""
