#!/usr/bin/env bash
set -e

echo ""
echo "==================================================================="
echo "🔍 COMPREHENSIVE FULL SITE AUDIT - Line by Line"
echo "==================================================================="
echo ""

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

# Output file
REPORT="FULL_SITE_AUDIT_REPORT.md"
echo "# FULL SITE AUDIT REPORT" > "$REPORT"
echo "**Generated:** $(date)" >> "$REPORT"
echo "**Site:** www.elevateforhumanity.org" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 1. MARKETING PAGES AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Find all marketing pages
MARKETING_PAGES=$(find app -name "page.tsx" -not -path "*/admin/*" -not -path "*/lms/*" -not -path "*/portal/*" -not -path "*/student/*" -not -path "*/instructor/*" -not -path "*/api/*" 2>/dev/null)

TOTAL_MARKETING=0
PAGES_WITH_HERO=0
PAGES_WITHOUT_HERO=0
PAGES_WITH_IMAGES=0
PAGES_WITH_METADATA=0

echo "### Marketing Pages Analysis" >> "$REPORT"
echo "" >> "$REPORT"

for page in $MARKETING_PAGES; do
    ((TOTAL_MARKETING++))
    
    # Check for hero section
    if grep -q "hero\|Hero\|HERO" "$page" 2>/dev/null; then
        ((PAGES_WITH_HERO++))
    else
        ((PAGES_WITHOUT_HERO++))
        echo "- ⚠️ **No Hero:** $page" >> "$REPORT"
    fi
    
    # Check for images
    if grep -q "Image\|img\|src=" "$page" 2>/dev/null; then
        ((PAGES_WITH_IMAGES++))
    fi
    
    # Check for metadata
    if grep -q "metadata\|Metadata" "$page" 2>/dev/null; then
        ((PAGES_WITH_METADATA++))
    fi
done

echo "" >> "$REPORT"
echo "**Total Marketing Pages:** $TOTAL_MARKETING" >> "$REPORT"
echo "**Pages with Hero:** $PAGES_WITH_HERO" >> "$REPORT"
echo "**Pages without Hero:** $PAGES_WITHOUT_HERO" >> "$REPORT"
echo "**Pages with Images:** $PAGES_WITH_IMAGES" >> "$REPORT"
echo "**Pages with Metadata:** $PAGES_WITH_METADATA" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 2. LMS PAGES AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Find all LMS pages
LMS_PAGES=$(find app/lms app/portal -name "page.tsx" 2>/dev/null || echo "")

TOTAL_LMS=0
for page in $LMS_PAGES; do
    ((TOTAL_LMS++))
done

echo "**Total LMS Pages:** $TOTAL_LMS" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 3. IMAGE AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Check for external images
EXTERNAL_IMAGES=$(grep -r "https://images.unsplash\|https://via.placeholder\|https://picsum" app --include="*.tsx" 2>/dev/null | wc -l)
echo "**External Image URLs:** $EXTERNAL_IMAGES" >> "$REPORT"

# Check for missing images
echo "" >> "$REPORT"
echo "### Missing Images" >> "$REPORT"
echo "" >> "$REPORT"

grep -r "src=\"/\|src='/\|src={\`/" app --include="*.tsx" -h 2>/dev/null | \
    sed -n 's/.*src=["'\''`]\([^"'\''`]*\)["'\''`].*/\1/p' | \
    grep "^/" | \
    sort -u | \
    while read img; do
        # Remove any template literals
        clean_img=$(echo "$img" | sed 's/\${[^}]*}//g')
        if [ ! -z "$clean_img" ] && [ ! -f "public$clean_img" ] 2>/dev/null; then
            echo "- ❌ Missing: $img" >> "$REPORT"
        fi
    done

echo "" >> "$REPORT"

echo "## 4. COMPONENT AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

TOTAL_COMPONENTS=$(find components -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
echo "**Total Components:** $TOTAL_COMPONENTS" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 5. TYPOGRAPHY & STYLING AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Check for inconsistent heading usage
MULTIPLE_H1=$(grep -r "<h1\|<H1" app --include="*.tsx" -l 2>/dev/null | while read file; do
    h1_count=$(grep -o "<h1\|<H1" "$file" | wc -l)
    if [ "$h1_count" -gt 1 ]; then
        echo "$file"
    fi
done | wc -l)

echo "**Pages with Multiple H1s:** $MULTIPLE_H1" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 6. ACCESSIBILITY AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Check for images without alt text
IMAGES_NO_ALT=$(grep -r "<Image\|<img" app --include="*.tsx" 2>/dev/null | grep -v "alt=" | wc -l)
echo "**Images without alt text:** $IMAGES_NO_ALT" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 7. SEO AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Check for pages without metadata
PAGES_NO_METADATA=$(find app -name "page.tsx" -not -path "*/api/*" 2>/dev/null | while read page; do
    if ! grep -q "metadata\|Metadata" "$page" 2>/dev/null; then
        echo "$page"
    fi
done | wc -l)

echo "**Pages without metadata:** $PAGES_NO_METADATA" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 8. MOBILE RESPONSIVENESS AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Check for responsive classes
PAGES_WITH_RESPONSIVE=$(grep -r "sm:\|md:\|lg:\|xl:" app --include="*.tsx" -l 2>/dev/null | wc -l)
echo "**Pages with responsive classes:** $PAGES_WITH_RESPONSIVE" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 9. PERFORMANCE AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Check for unoptimized images
UNOPTIMIZED_IMAGES=$(grep -r "<img" app --include="*.tsx" 2>/dev/null | wc -l)
echo "**Unoptimized <img> tags (should use Next.js Image):** $UNOPTIMIZED_IMAGES" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 10. CONTENT QUALITY AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Check for placeholder content
PLACEHOLDER_CONTENT=$(grep -ri "lorem\|ipsum\|placeholder text\|coming soon\|under construction" app --include="*.tsx" 2>/dev/null | grep -v "placeholder=" | wc -l)
echo "**Placeholder/Generic Content:** $PLACEHOLDER_CONTENT" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 11. NAVIGATION AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Check navigation components
NAV_COMPONENTS=$(find components -name "*Nav*" -o -name "*nav*" -o -name "*Menu*" -o -name "*menu*" 2>/dev/null | wc -l)
echo "**Navigation Components:** $NAV_COMPONENTS" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 12. FORM AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Find all forms
TOTAL_FORMS=$(grep -r "<form\|<Form" app --include="*.tsx" -l 2>/dev/null | wc -l)
echo "**Total Forms:** $TOTAL_FORMS" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 13. CTA AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

# Check for CTAs
APPLY_BUTTONS=$(grep -ri "apply now\|start now\|enroll\|get started" app --include="*.tsx" 2>/dev/null | wc -l)
echo "**CTA Buttons Found:** $APPLY_BUTTONS" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 14. PROGRAM PAGES AUDIT" >> "$REPORT"
echo "" >> "$REPORT"

PROGRAM_PAGES=$(find app/programs -name "page.tsx" 2>/dev/null | wc -l)
echo "**Total Program Pages:** $PROGRAM_PAGES" >> "$REPORT"
echo "" >> "$REPORT"

echo "### Program Pages Checklist" >> "$REPORT"
for page in $(find app/programs -name "page.tsx" 2>/dev/null | head -10); do
    echo "" >> "$REPORT"
    echo "**$page**" >> "$REPORT"
    
    # Check for required sections
    if grep -q "Overview\|overview" "$page" 2>/dev/null; then
        echo "- ✅ Has Overview" >> "$REPORT"
    else
        echo "- ❌ Missing Overview" >> "$REPORT"
    fi
    
    if grep -q "Curriculum\|curriculum\|What You'll Learn" "$page" 2>/dev/null; then
        echo "- ✅ Has Curriculum" >> "$REPORT"
    else
        echo "- ❌ Missing Curriculum" >> "$REPORT"
    fi
    
    if grep -q "Career\|career\|Outcomes\|outcomes\|salary" "$page" 2>/dev/null; then
        echo "- ✅ Has Career Info" >> "$REPORT"
    else
        echo "- ❌ Missing Career Info" >> "$REPORT"
    fi
    
    if grep -q "Apply\|apply\|Enroll\|enroll" "$page" 2>/dev/null; then
        echo "- ✅ Has Apply CTA" >> "$REPORT"
    else
        echo "- ❌ Missing Apply CTA" >> "$REPORT"
    fi
done

echo "" >> "$REPORT"
echo "## 15. FINAL RECOMMENDATIONS" >> "$REPORT"
echo "" >> "$REPORT"

# Calculate completion percentage
TOTAL_CHECKS=14
ISSUES_FOUND=0

[ "$PAGES_WITHOUT_HERO" -gt 0 ] && ((ISSUES_FOUND++))
[ "$EXTERNAL_IMAGES" -gt 0 ] && ((ISSUES_FOUND++))
[ "$IMAGES_NO_ALT" -gt 10 ] && ((ISSUES_FOUND++))
[ "$PAGES_NO_METADATA" -gt 10 ] && ((ISSUES_FOUND++))
[ "$PLACEHOLDER_CONTENT" -gt 0 ] && ((ISSUES_FOUND++))
[ "$UNOPTIMIZED_IMAGES" -gt 5 ] && ((ISSUES_FOUND++))
[ "$MULTIPLE_H1" -gt 0 ] && ((ISSUES_FOUND++))

COMPLETION=$((100 - (ISSUES_FOUND * 100 / TOTAL_CHECKS)))

echo "**Site Completion Score:** $COMPLETION%" >> "$REPORT"
echo "" >> "$REPORT"

if [ "$COMPLETION" -ge 90 ]; then
    echo "🎉 **Status:** EXCELLENT - Site is production-ready" >> "$REPORT"
elif [ "$COMPLETION" -ge 75 ]; then
    echo "✅ **Status:** GOOD - Minor improvements needed" >> "$REPORT"
elif [ "$COMPLETION" -ge 60 ]; then
    echo "⚠️ **Status:** FAIR - Several issues to address" >> "$REPORT"
else
    echo "❌ **Status:** NEEDS WORK - Major improvements required" >> "$REPORT"
fi

echo "" >> "$REPORT"
echo "### Priority Fixes" >> "$REPORT"
echo "" >> "$REPORT"

[ "$PAGES_WITHOUT_HERO" -gt 0 ] && echo "1. Add hero sections to $PAGES_WITHOUT_HERO pages" >> "$REPORT"
[ "$EXTERNAL_IMAGES" -gt 0 ] && echo "2. Replace $EXTERNAL_IMAGES external images with local files" >> "$REPORT"
[ "$IMAGES_NO_ALT" -gt 10 ] && echo "3. Add alt text to images" >> "$REPORT"
[ "$PAGES_NO_METADATA" -gt 10 ] && echo "4. Add metadata to pages" >> "$REPORT"
[ "$PLACEHOLDER_CONTENT" -gt 0 ] && echo "5. Replace placeholder content" >> "$REPORT"

echo "" >> "$REPORT"
echo "---" >> "$REPORT"
echo "**Report Generated:** $(date)" >> "$REPORT"
echo "**Next Review:** $(date -d '+7 days' 2>/dev/null || date -v+7d 2>/dev/null || echo 'In 7 days')" >> "$REPORT"

echo ""
echo "✅ Full site audit complete!"
echo "📄 Report saved to: $REPORT"
echo ""

cat "$REPORT"
