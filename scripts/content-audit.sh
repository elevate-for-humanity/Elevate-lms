#!/usr/bin/env bash
set -e

echo ""
echo "==================================================================="
echo "📋 CONTENT AUDIT - Finding Generic Content & Missing Images"
echo "==================================================================="
echo ""

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "## SCANNING FOR ISSUES"
echo ""

# 1. Find placeholder/generic text
echo "### 1. Generic/Placeholder Text"
echo "-----------------------------------"
GENERIC_TEXT=$(grep -r "lorem\|ipsum\|placeholder text\|generic content\|TODO:\|FIXME:\|TBD" app --include="*.tsx" --include="*.ts" -n 2>/dev/null | grep -v "placeholder=" | wc -l)
if [ "$GENERIC_TEXT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $GENERIC_TEXT instances of generic/placeholder text${NC}"
    grep -r "lorem\|ipsum\|placeholder text\|generic content\|TODO:\|FIXME:\|TBD" app --include="*.tsx" --include="*.ts" -n 2>/dev/null | grep -v "placeholder=" | head -10
else
    echo -e "${GREEN}✅ No generic placeholder text found${NC}"
fi
echo ""

# 2. Find missing/broken image references
echo "### 2. Missing/Broken Image References"
echo "-----------------------------------"
MISSING_IMAGES=$(grep -r "src=\"/images\|src='/images\|src=\"/media\|src='/media" app --include="*.tsx" -h 2>/dev/null | sed 's/.*src=["'\'']\([^"'\'']*\)["'\''].*/\1/' | sort -u | while read img; do
    if [ ! -f "public$img" ]; then
        echo "$img"
    fi
done | wc -l)

if [ "$MISSING_IMAGES" -gt 0 ]; then
    echo -e "${RED}❌ Found $MISSING_IMAGES missing image files${NC}"
    grep -r "src=\"/images\|src='/images\|src=\"/media\|src='/media" app --include="*.tsx" -h 2>/dev/null | sed 's/.*src=["'\'']\([^"'\'']*\)["'\''].*/\1/' | sort -u | while read img; do
        if [ ! -f "public$img" ]; then
            echo "  Missing: $img"
        fi
    done | head -10
else
    echo -e "${GREEN}✅ All image references point to existing files${NC}"
fi
echo ""

# 3. Find external image URLs (Unsplash, etc.)
echo "### 3. External Image URLs"
echo "-----------------------------------"
EXTERNAL_IMAGES=$(grep -r "https://images.unsplash\|https://via.placeholder\|https://picsum\|https://source.unsplash" app --include="*.tsx" -n 2>/dev/null | wc -l)
if [ "$EXTERNAL_IMAGES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $EXTERNAL_IMAGES external image URLs${NC}"
    grep -r "https://images.unsplash\|https://via.placeholder\|https://picsum\|https://source.unsplash" app --include="*.tsx" -n 2>/dev/null | head -10
else
    echo -e "${GREEN}✅ No external image URLs found${NC}"
fi
echo ""

# 4. Find pages without hero sections
echo "### 4. Pages Without Hero Sections"
echo "-----------------------------------"
PAGES_WITHOUT_HERO=0
for page in $(find app -name "page.tsx" -not -path "*/api/*" -not -path "*/admin/*" 2>/dev/null | head -50); do
    if ! grep -q "hero\|Hero\|HERO\|banner\|Banner" "$page" 2>/dev/null; then
        echo "  No hero: $page"
        ((PAGES_WITHOUT_HERO++))
    fi
done
if [ "$PAGES_WITHOUT_HERO" -eq 0 ]; then
    echo -e "${GREEN}✅ All checked pages have hero sections${NC}"
else
    echo -e "${YELLOW}⚠️  Found $PAGES_WITHOUT_HERO pages without hero sections (checked first 50)${NC}"
fi
echo ""

# 5. Find generic hero images
echo "### 5. Generic/Stock Hero Images"
echo "-----------------------------------"
GENERIC_HEROES=$(grep -r "hero-placeholder\|stock-photo\|generic-hero\|default-hero" app --include="*.tsx" -n 2>/dev/null | wc -l)
if [ "$GENERIC_HEROES" -gt 0 ]; then
    echo -e "${RED}❌ Found $GENERIC_HEROES generic hero images${NC}"
    grep -r "hero-placeholder\|stock-photo\|generic-hero\|default-hero" app --include="*.tsx" -n 2>/dev/null | head -10
else
    echo -e "${GREEN}✅ No generic hero images found${NC}"
fi
echo ""

# 6. Find pages with gradient overlays
echo "### 6. Pages With Heavy Gradient Overlays"
echo "-----------------------------------"
HEAVY_OVERLAYS=$(grep -r "bg-gradient.*from-.*900\|bg-black/[7-9][0-9]\|bg-slate-900/[7-9]" app --include="*.tsx" -l 2>/dev/null | wc -l)
if [ "$HEAVY_OVERLAYS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $HEAVY_OVERLAYS pages with heavy gradient overlays${NC}"
    grep -r "bg-gradient.*from-.*900\|bg-black/[7-9][0-9]\|bg-slate-900/[7-9]" app --include="*.tsx" -l 2>/dev/null | head -10
else
    echo -e "${GREEN}✅ No heavy gradient overlays found${NC}"
fi
echo ""

# 7. Find informational vs storytelling content
echo "### 7. Content Style Analysis"
echo "-----------------------------------"
INFORMATIONAL_MARKERS=$(grep -r "We offer\|We provide\|Our services\|Features include" app --include="*.tsx" 2>/dev/null | wc -l)
STORYTELLING_MARKERS=$(grep -r "Imagine\|Meet\|Story\|Journey\|Transform" app --include="*.tsx" 2>/dev/null | wc -l)
echo "  Informational markers: $INFORMATIONAL_MARKERS"
echo "  Storytelling markers: $STORYTELLING_MARKERS"
if [ "$STORYTELLING_MARKERS" -lt "$INFORMATIONAL_MARKERS" ]; then
    echo -e "${YELLOW}⚠️  Content leans more informational than storytelling${NC}"
else
    echo -e "${GREEN}✅ Good balance of storytelling content${NC}"
fi
echo ""

# 8. Find pages with empty/minimal content
echo "### 8. Pages With Minimal Content"
echo "-----------------------------------"
MINIMAL_PAGES=0
for page in $(find app -name "page.tsx" -not -path "*/api/*" 2>/dev/null | head -50); do
    LINES=$(wc -l < "$page")
    if [ "$LINES" -lt 50 ]; then
        echo "  Minimal content ($LINES lines): $page"
        ((MINIMAL_PAGES++))
    fi
done
if [ "$MINIMAL_PAGES" -eq 0 ]; then
    echo -e "${GREEN}✅ All checked pages have substantial content${NC}"
else
    echo -e "${YELLOW}⚠️  Found $MINIMAL_PAGES pages with minimal content (checked first 50)${NC}"
fi
echo ""

# 9. Find duplicate content
echo "### 9. Potential Duplicate Content"
echo "-----------------------------------"
echo "  Checking for repeated text blocks..."
DUPLICATE_BLOCKS=$(grep -r "100% government-funded\|No tuition, no debt\|WIOA approved" app --include="*.tsx" -l 2>/dev/null | wc -l)
echo "  Pages with common phrases: $DUPLICATE_BLOCKS"
if [ "$DUPLICATE_BLOCKS" -gt 20 ]; then
    echo -e "${YELLOW}⚠️  Many pages use similar phrases - consider varying content${NC}"
else
    echo -e "${GREEN}✅ Good content variety${NC}"
fi
echo ""

# 10. Summary
echo "==================================================================="
echo "📊 AUDIT SUMMARY"
echo "==================================================================="
echo ""
echo "Issues Found:"
echo "  - Generic text: $GENERIC_TEXT"
echo "  - Missing images: $MISSING_IMAGES"
echo "  - External images: $EXTERNAL_IMAGES"
echo "  - Pages without heroes: $PAGES_WITHOUT_HERO"
echo "  - Generic heroes: $GENERIC_HEROES"
echo "  - Heavy overlays: $HEAVY_OVERLAYS"
echo "  - Minimal content pages: $MINIMAL_PAGES"
echo ""

TOTAL_ISSUES=$((GENERIC_TEXT + MISSING_IMAGES + EXTERNAL_IMAGES + PAGES_WITHOUT_HERO + GENERIC_HEROES + HEAVY_OVERLAYS + MINIMAL_PAGES))

if [ "$TOTAL_ISSUES" -eq 0 ]; then
    echo -e "${GREEN}🎉 No major issues found! Site content looks good.${NC}"
else
    echo -e "${YELLOW}⚠️  Found $TOTAL_ISSUES total issues to address${NC}"
    echo ""
    echo "Recommendations:"
    echo "  1. Replace generic text with specific, storytelling content"
    echo "  2. Add missing images or update references"
    echo "  3. Replace external images with local repository files"
    echo "  4. Add hero sections to pages without them"
    echo "  5. Use real facility/program photos instead of generic images"
    echo "  6. Reduce heavy gradient overlays to show images better"
    echo "  7. Expand minimal content pages with more detail"
fi
echo ""
echo "✅ Content audit complete!"
echo ""
