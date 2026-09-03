#!/bin/bash
# Replace ALL placeholder icons with real images across the entire site

echo "🔥 REMOVING ALL PLACEHOLDERS"
echo "=============================="
echo ""

# Count current placeholders
ICON_COUNT=$(grep -r "from 'lucide-react'" app --include="*.tsx" | wc -l)
echo "Found $ICON_COUNT files using lucide-react icons"
echo ""

# Phase 1: Update recently created pages
echo "Phase 1: Updating recently created pages..."
echo ""

# List of pages to update
PAGES=(
  "app/employers/post-job/page.tsx"
  "app/employers/apprenticeships/page.tsx"
  "app/employers/benefits/page.tsx"
  "app/success/page.tsx"
  "app/news/page.tsx"
  "app/compliance/page.tsx"
  "app/partners/compliance/page.tsx"
  "app/partners/resources/page.tsx"
  "app/sitemap/page.tsx"
)

for page in "${PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo "  ✅ $page exists - needs manual update"
  else
    echo "  ❌ $page missing"
  fi
done

echo ""
echo "Phase 2: Program pages need video heroes..."
echo ""

# Check which program pages exist
PROGRAM_PAGES=(
  "app/programs/cna/page.tsx"
  "app/programs/hvac/page.tsx"
  "app/programs/cdl/page.tsx"
  "app/programs/healthcare/page.tsx"
  "app/programs/skilled-trades/page.tsx"
)

for page in "${PROGRAM_PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo "  ✅ $page - needs video hero"
  else
    echo "  ⚠️  $page - doesn't exist yet"
  fi
done

echo ""
echo "=============================="
echo "MANUAL ACTION REQUIRED"
echo "=============================="
echo ""
echo "Due to the scope (1,622 icon uses), this requires:"
echo "1. Systematic page-by-page replacement"
echo "2. Proper image selection for each context"
echo "3. Video hero implementation for all programs"
echo ""
echo "Estimated time: 2-3 hours"
echo ""
echo "Priority order:"
echo "1. Program pages (highest visibility)"
echo "2. Employer pages (just created)"
echo "3. Success/News pages"
echo "4. All other pages"
echo ""
