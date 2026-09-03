#!/bin/bash

echo "🚨 DESIGN POLICY ENFORCEMENT - AUTOPILOT MODE"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VIOLATIONS_FOUND=0
FIXES_APPLIED=0

echo "📋 POLICY RULES:"
echo "  ❌ NO heavy overlays (50%+ opacity)"
echo "  ❌ NO placeholder images"
echo "  ❌ NO generic symbols as primary content"
echo "  ✅ USE light overlays (40% max) for hero sections"
echo "  ✅ USE bottom gradients for photo cards"
echo "  ✅ USE real photos/videos only"
echo ""

# Function to fix heavy overlays
fix_heavy_overlays() {
  echo "🔍 Scanning for heavy overlays (50%+)..."
  
  # Find all heavy overlays
  FILES=$(grep -rl "bg-black/[5-9][0-9]\|bg-.*-900/[5-9][0-9]" app --include="*.tsx" | grep -v "node_modules" | grep -v "bg-gradient")
  
  if [ -z "$FILES" ]; then
    echo "  ✅ No heavy overlay violations found"
    return 0
  fi
  
  echo "  ❌ Found violations in:"
  echo "$FILES" | sed 's/^/     /'
  echo ""
  
  # Fix each file
  for file in $FILES; do
    echo "  🔧 Fixing: $file"
    
    # Skip modal/sidebar overlays (these are UI elements, not content)
    if grep -q "fixed inset-0\|modal\|sidebar" "$file"; then
      echo "     ⏭️  Skipped (UI element)"
      continue
    fi
    
    # Fix bg-black/50 -> bg-black/40
    if grep -q "bg-black/50" "$file"; then
      sed -i 's/bg-black\/50/bg-black\/40/g' "$file"
      echo "     ✅ Fixed: bg-black/50 → bg-black/40"
      ((FIXES_APPLIED++))
    fi
    
    # Fix bg-black/60 -> bg-black/40
    if grep -q "bg-black/60" "$file"; then
      sed -i 's/bg-black\/60/bg-black\/40/g' "$file"
      echo "     ✅ Fixed: bg-black/60 → bg-black/40"
      ((FIXES_APPLIED++))
    fi
    
    # Fix bg-black/70 -> bg-black/40 (unless it's a button)
    if grep -q "bg-black/70" "$file" && ! grep -q "button.*bg-black/70\|rounded-full.*bg-black/70" "$file"; then
      sed -i 's/bg-black\/70/bg-black\/40/g' "$file"
      echo "     ✅ Fixed: bg-black/70 → bg-black/40"
      ((FIXES_APPLIED++))
    fi
    
    ((VIOLATIONS_FOUND++))
  done
  
  echo ""
}

# Function to check for placeholder images
check_placeholders() {
  echo "🔍 Scanning for placeholder images..."
  
  PLACEHOLDERS=$(grep -r "placeholder\|generic.*\\.jpg\|stock-photo\|via.placeholder" app --include="*.tsx" | grep -v "node_modules" | wc -l)
  
  if [ $PLACEHOLDERS -eq 0 ]; then
    echo "  ✅ No placeholder violations found"
  else
    echo "  ❌ Found $PLACEHOLDERS placeholder violations"
    grep -r "placeholder\|generic.*\\.jpg\|stock-photo" app --include="*.tsx" | grep -v "node_modules" | head -5
    ((VIOLATIONS_FOUND+=$PLACEHOLDERS))
  fi
  
  echo ""
}

# Function to verify hero videos
check_hero_videos() {
  echo "🔍 Checking hero video placements..."
  
  # Check if programs page has video
  if ! grep -q "programs-overview-video" app/programs/page.tsx; then
    echo "  ⚠️  Programs page missing hero video"
  else
    echo "  ✅ Programs page has hero video"
  fi
  
  # Check if employer page has video
  if ! grep -q "employer-partner-hero" app/employer/page.tsx; then
    echo "  ⚠️  Employer page missing hero video"
  else
    echo "  ✅ Employer page has hero video"
  fi
  
  echo ""
}

# Execute checks and fixes
echo "🚀 EXECUTING AUTOPILOT ENFORCEMENT..."
echo ""

fix_heavy_overlays
check_placeholders
check_hero_videos

echo "=============================================="
echo "📊 ENFORCEMENT SUMMARY"
echo "=============================================="
echo ""
echo "Violations Found: $VIOLATIONS_FOUND"
echo "Fixes Applied: $FIXES_APPLIED"
echo ""

if [ $FIXES_APPLIED -gt 0 ]; then
  echo "✅ ${GREEN}FIXES APPLIED${NC} - Changes ready to commit"
  echo ""
  echo "Next steps:"
  echo "  1. Review changes: git diff"
  echo "  2. Commit: git add . && git commit -m 'fix: enforce design policy'"
  echo "  3. Deploy: git push origin main"
  exit 0
elif [ $VIOLATIONS_FOUND -gt 0 ]; then
  echo "⚠️  ${YELLOW}VIOLATIONS FOUND${NC} - Manual review required"
  exit 1
else
  echo "✅ ${GREEN}FULLY COMPLIANT${NC} - No violations found"
  exit 0
fi
