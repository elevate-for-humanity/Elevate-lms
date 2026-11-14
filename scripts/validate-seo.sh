#!/bin/bash

# Quick SEO Validation Script

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}SEO Validation Check${NC}"
echo -e "${GREEN}=========================================${NC}"

# Check 1: UniversalSEO component exists
echo -n "Checking UniversalSEO component... "
if [ -f "src/components/UniversalSEO.tsx" ]; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
    exit 1
fi

# Check 2: SiteLayout imports UniversalSEO
echo -n "Checking SiteLayout import... "
if grep -q "import UniversalSEO" "src/layouts/SiteLayout.tsx"; then
    echo -e "${GREEN}✅ Imported${NC}"
else
    echo -e "${RED}❌ Not imported${NC}"
    exit 1
fi

# Check 3: SiteLayout uses UniversalSEO
echo -n "Checking SiteLayout usage... "
if grep -q "<UniversalSEO" "src/layouts/SiteLayout.tsx"; then
    echo -e "${GREEN}✅ Used${NC}"
else
    echo -e "${RED}❌ Not used${NC}"
    exit 1
fi

# Check 4: Build succeeds
echo -n "Checking build... "
if npm run build &>/dev/null; then
    echo -e "${GREEN}✅ Success${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    exit 1
fi

# Check 5: Analyze build output
echo ""
echo "Analyzing build output..."

html_files=$(find dist -name "*.html" 2>/dev/null | wc -l)
canonical_count=$(find dist -name "*.html" -exec grep -l "canonical" {} \; 2>/dev/null | wc -l)
og_count=$(find dist -name "*.html" -exec grep -l "og:title" {} \; 2>/dev/null | wc -l)
description_count=$(find dist -name "*.html" -exec grep -l "name=\"description\"" {} \; 2>/dev/null | wc -l)

echo ""
echo "📊 SEO Coverage Report:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "Total HTML Files:    %3d (100%%)\n" $html_files
printf "Canonical URLs:      %3d (%3d%%)\n" $canonical_count $((canonical_count * 100 / html_files))
printf "Open Graph Tags:     %3d (%3d%%)\n" $og_count $((og_count * 100 / html_files))
printf "Meta Descriptions:   %3d (%3d%%)\n" $description_count $((description_count * 100 / html_files))
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Calculate overall score
canonical_pct=$((canonical_count * 100 / html_files))
og_pct=$((og_count * 100 / html_files))
description_pct=$((description_count * 100 / html_files))

overall_score=$(( (canonical_pct + og_pct + description_pct) / 3 ))

echo ""
echo -n "Overall SEO Score: "
if [ $overall_score -ge 95 ]; then
    echo -e "${GREEN}${overall_score}% ✅ EXCELLENT${NC}"
elif [ $overall_score -ge 80 ]; then
    echo -e "${YELLOW}${overall_score}% ⚠️  GOOD${NC}"
else
    echo -e "${RED}${overall_score}% ❌ NEEDS IMPROVEMENT${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Validation Complete${NC}"
echo -e "${GREEN}=========================================${NC}"

exit 0
