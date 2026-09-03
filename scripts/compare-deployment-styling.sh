#!/bin/bash
# Compare deployed site styling vs source code
# Identifies missing CSS, broken styles, and styling issues

set -e

echo "🎨 DEPLOYMENT STYLING ANALYSIS"
echo "================================"
echo ""

SITE_URL="https://elevateproduction.netlify.app"

echo "Target site: $SITE_URL"
echo ""

# Check if site is accessible
echo "1. Checking site accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Site is accessible (HTTP $HTTP_STATUS)"
else
    echo "   ❌ Site returned HTTP $HTTP_STATUS"
    echo "   Waiting for deployment to complete..."
    exit 1
fi
echo ""

# Check for CSS files
echo "2. Checking CSS files in deployment..."
echo ""

# Download homepage
curl -s "$SITE_URL" > /tmp/homepage.html

# Extract CSS references
echo "   CSS files referenced in HTML:"
grep -o 'href="[^"]*\.css"' /tmp/homepage.html | sed 's/href="//;s/"$//' | while read css_file; do
    if [[ $css_file == http* ]]; then
        CSS_URL="$css_file"
    else
        CSS_URL="$SITE_URL$css_file"
    fi
    
    CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CSS_URL")
    CSS_SIZE=$(curl -s "$CSS_URL" | wc -c)
    
    if [ "$CSS_STATUS" = "200" ]; then
        echo "   ✅ $css_file (${CSS_SIZE} bytes)"
    else
        echo "   ❌ $css_file (HTTP $CSS_STATUS - MISSING)"
    fi
done
echo ""

# Check for inline styles
echo "3. Checking for inline styles..."
INLINE_STYLES=$(grep -o '<style[^>]*>' /tmp/homepage.html | wc -l)
echo "   Found $INLINE_STYLES inline <style> blocks"
echo ""

# Check for Tailwind classes
echo "4. Checking for Tailwind CSS usage..."
TAILWIND_CLASSES=$(grep -o 'class="[^"]*"' /tmp/homepage.html | grep -E '(flex|grid|p-|m-|text-|bg-|border-)' | wc -l)
echo "   Found $TAILWIND_CLASSES Tailwind utility classes"
echo ""

# Check source code styling
echo "5. Checking source code styling setup..."
echo ""

if [ -f "tailwind.config.js" ]; then
    echo "   ✅ tailwind.config.js exists"
else
    echo "   ❌ tailwind.config.js missing"
fi

if [ -f "postcss.config.js" ]; then
    echo "   ✅ postcss.config.js exists"
else
    echo "   ❌ postcss.config.js missing"
fi

if [ -d "src/styles" ]; then
    echo "   📁 src/styles/ directory:"
    ls -la src/styles/ | tail -n +4 | awk '{print "      " $9 " (" $5 " bytes)"}'
else
    echo "   ℹ️  No src/styles/ directory"
fi
echo ""

# Check for custom CSS imports
echo "6. Checking for CSS imports in source..."
CSS_IMPORTS=$(grep -r "import.*\.css" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | wc -l)
echo "   Found $CSS_IMPORTS CSS import statements"

if [ "$CSS_IMPORTS" -gt 0 ]; then
    echo ""
    echo "   CSS imports found:"
    grep -r "import.*\.css" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | head -10 | while read line; do
        echo "      $line"
    done
fi
echo ""

# Check build output
echo "7. Checking build output..."
if [ -d "dist" ]; then
    echo "   📁 dist/ directory exists"
    
    DIST_CSS=$(find dist -name "*.css" -type f | wc -l)
    echo "   Found $DIST_CSS CSS files in dist/"
    
    if [ "$DIST_CSS" -gt 0 ]; then
        echo ""
        echo "   CSS files in dist/:"
        find dist -name "*.css" -type f -exec ls -lh {} \; | awk '{print "      " $9 " (" $5 ")"}'
    fi
else
    echo "   ⚠️  dist/ directory not found (run: pnpm build)"
fi
echo ""

# Check for missing styles
echo "8. Analyzing potential styling issues..."
echo ""

# Check if docebo.css was removed
if grep -q "docebo.css" src/main.tsx 2>/dev/null; then
    echo "   ⚠️  docebo.css still imported in main.tsx"
else
    echo "   ✅ docebo.css import removed"
fi

# Check if hero-banner.css was removed
if grep -q "hero-banner.css" src/components/HeroBanner.tsx 2>/dev/null; then
    echo "   ⚠️  hero-banner.css still imported in HeroBanner.tsx"
else
    echo "   ✅ hero-banner.css import removed (or file doesn't exist)"
fi

# Check for component-specific CSS
COMPONENT_CSS=$(find src/components -name "*.css" 2>/dev/null | wc -l)
if [ "$COMPONENT_CSS" -gt 0 ]; then
    echo "   ⚠️  Found $COMPONENT_CSS component-specific CSS files"
    find src/components -name "*.css" 2>/dev/null | while read file; do
        echo "      - $file"
    done
else
    echo "   ✅ No component-specific CSS files"
fi
echo ""

# Summary
echo "================================"
echo "SUMMARY"
echo "================================"
echo ""

echo "Styling System:"
if [ -f "tailwind.config.js" ] && [ "$TAILWIND_CLASSES" -gt 0 ]; then
    echo "  ✅ Tailwind CSS (active)"
else
    echo "  ⚠️  Tailwind CSS (check configuration)"
fi

echo ""
echo "Potential Issues:"
ISSUES=0

if [ "$HTTP_STATUS" != "200" ]; then
    echo "  ❌ Site not accessible"
    ISSUES=$((ISSUES + 1))
fi

if [ "$DIST_CSS" -eq 0 ]; then
    echo "  ⚠️  No CSS files in dist/ (rebuild needed?)"
    ISSUES=$((ISSUES + 1))
fi

if [ "$CSS_IMPORTS" -gt 0 ]; then
    echo "  ℹ️  $CSS_IMPORTS CSS imports found (verify they exist)"
fi

if [ "$COMPONENT_CSS" -gt 0 ]; then
    echo "  ⚠️  Component-specific CSS files found (should use Tailwind)"
    ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
    echo "  ✅ No major issues detected"
fi

echo ""
echo "Next Steps:"
echo "  1. Visit: $SITE_URL"
echo "  2. Open browser DevTools (F12)"
echo "  3. Check Console for errors"
echo "  4. Check Network tab for failed CSS requests"
echo "  5. Inspect elements to verify Tailwind classes"
echo ""
