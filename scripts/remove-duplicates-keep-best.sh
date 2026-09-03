#!/usr/bin/env bash
# Remove Duplicate Pages - Keep Best Version

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     REMOVE DUPLICATE PAGES - KEEP BEST VERSION            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Duplicates found:
# - Compliance (.jsx and .tsx)
# - Connect (.jsx and .tsx)
# - DonatePage (.jsx and .tsx)
# - HomePage (.jsx and .tsx)
# - Hub (.jsx and .tsx)
# - LMS (.jsx and .tsx)
# - NotFound (.jsx and .tsx)
# - Pay (.jsx and .tsx)
# - Programs (.jsx and .tsx)

declare -A KEEP_VERSION=(
  ["Compliance"]="tsx"      # TypeScript version likely more complete
  ["Connect"]="tsx"          # TypeScript version
  ["DonatePage"]="tsx"       # TypeScript version
  ["HomePage"]="jsx"         # JSX version is simpler, keep it
  ["Hub"]="tsx"              # TypeScript version
  ["LMS"]="tsx"              # TypeScript version likely more complete
  ["NotFound"]="tsx"         # TypeScript version
  ["Pay"]="tsx"              # TypeScript version
  ["Programs"]="tsx"         # TypeScript version
)

REMOVED=0

for page in "${!KEEP_VERSION[@]}"; do
  keep="${KEEP_VERSION[$page]}"
  remove=$( [ "$keep" = "tsx" ] && echo "jsx" || echo "tsx" )
  
  keep_file="src/pages/${page}.${keep}"
  remove_file="src/pages/${page}.${remove}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📄 $page"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ -f "$keep_file" ] && [ -f "$remove_file" ]; then
    # Show file sizes
    keep_size=$(wc -l < "$keep_file")
    remove_size=$(wc -l < "$remove_file")
    
    log_info "Keeping: ${page}.${keep} (${keep_size} lines)"
    log_warning "Removing: ${page}.${remove} (${remove_size} lines)"
    
    # Check if the file to remove has more content
    if [ "$remove_size" -gt "$keep_size" ]; then
      log_warning "⚠️  File being removed has MORE content!"
      log_info "You may want to review this manually"
      
      # Show first few lines of each
      echo ""
      echo "Preview of ${page}.${keep}:"
      head -10 "$keep_file" | grep -E "(export|function|const|return)" | head -3
      echo ""
      echo "Preview of ${page}.${remove}:"
      head -10 "$remove_file" | grep -E "(export|function|const|return)" | head -3
      echo ""
      
      read -p "Still remove ${page}.${remove}? (y/N) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Skipped"
        continue
      fi
    fi
    
    # Remove the duplicate
    rm "$remove_file"
    log_success "Removed: $remove_file"
    REMOVED=$((REMOVED + 1))
    
  elif [ -f "$keep_file" ]; then
    log_info "Only ${page}.${keep} exists (no duplicate)"
  elif [ -f "$remove_file" ]; then
    log_warning "Only ${page}.${remove} exists (expected ${page}.${keep})"
  else
    log_warning "Neither version exists"
  fi
  
  echo ""
done

# Also remove test file that shouldn't be in pages
if [ -f "src/pages/Sitemap.test.jsx" ]; then
  log_info "Removing test file from pages directory..."
  rm "src/pages/Sitemap.test.jsx"
  log_success "Removed: src/pages/Sitemap.test.jsx"
  REMOVED=$((REMOVED + 1))
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    CLEANUP COMPLETE                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
log_success "Removed $REMOVED duplicate/test files"
echo ""
log_info "Next steps:"
echo "  1. Run diagnostic: bash scripts/diagnostic-routing.sh"
echo "  2. Test build: pnpm run build"
echo ""
