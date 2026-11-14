#!/bin/bash
# Build Verification Script
# Checks that the build output is correct and all assets are in place

set -e

echo "🔍 Verifying build output..."
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist/ directory not found. Run 'pnpm run build' first."
  exit 1
fi

echo "✅ dist/ directory exists"

# Check if images directory exists
if [ ! -d "dist/images" ]; then
  echo "❌ dist/images/ directory not found"
  exit 1
fi

echo "✅ dist/images/ directory exists"

# Count images
IMAGE_COUNT=$(find dist/images -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" -o -name "*.svg" \) | wc -l)
echo "✅ Found $IMAGE_COUNT image files"

# Check for programs images
if [ ! -d "dist/images/programs" ]; then
  echo "⚠️  dist/images/programs/ directory not found"
else
  PROGRAM_IMAGES=$(find dist/images/programs -type f | wc -l)
  echo "✅ Found $PROGRAM_IMAGES program images"
fi

# Check for partners images
if [ ! -d "dist/images/partners" ]; then
  echo "⚠️  dist/images/partners/ directory not found"
else
  PARTNER_IMAGES=$(find dist/images/partners -type f | wc -l)
  echo "✅ Found $PARTNER_IMAGES partner images"
fi

# Check for index.html
if [ ! -f "dist/index.html" ]; then
  echo "❌ dist/index.html not found"
  exit 1
fi

echo "✅ dist/index.html exists"

# Check for assets directory
if [ ! -d "dist/assets" ]; then
  echo "❌ dist/assets/ directory not found"
  exit 1
fi

echo "✅ dist/assets/ directory exists"

# Count JS bundles
JS_COUNT=$(find dist/assets -name "*.js" | wc -l)
echo "✅ Found $JS_COUNT JavaScript bundles"

# Count CSS files
CSS_COUNT=$(find dist/assets -name "*.css" | wc -l)
echo "✅ Found $CSS_COUNT CSS files"

# Check for image paths in JS files (should have leading slash)
echo ""
echo "🔍 Checking image paths in JavaScript bundles..."

# Look for paths without leading slash (potential issues)
BAD_PATHS=$(grep -r '"images/' dist/assets/*.js 2>/dev/null | grep -v '"/images/' | wc -l || echo "0")

if [ "$BAD_PATHS" -gt 0 ]; then
  echo "⚠️  Found $BAD_PATHS image paths without leading slash"
  echo "   These may not load correctly in production:"
  grep -r '"images/' dist/assets/*.js 2>/dev/null | grep -v '"/images/' | head -5
else
  echo "✅ All image paths have correct leading slash"
fi

# Check for _headers file
if [ ! -f "dist/_headers" ]; then
  echo "⚠️  dist/_headers not found (needed for Netlify)"
else
  echo "✅ dist/_headers exists"
fi

# Check for _redirects file
if [ ! -f "dist/_redirects" ]; then
  echo "⚠️  dist/_redirects not found (needed for Netlify)"
else
  echo "✅ dist/_redirects exists"
fi

# Check for sitemap
if [ ! -f "dist/sitemap.xml" ]; then
  echo "⚠️  dist/sitemap.xml not found"
else
  echo "✅ dist/sitemap.xml exists"
fi

# Check for robots.txt
if [ ! -f "dist/robots.txt" ]; then
  echo "⚠️  dist/robots.txt not found"
else
  echo "✅ dist/robots.txt exists"
fi

echo ""
echo "📊 Build Summary:"
echo "   Images: $IMAGE_COUNT total"
echo "   JavaScript: $JS_COUNT bundles"
echo "   CSS: $CSS_COUNT files"
echo ""

# Calculate total size
TOTAL_SIZE=$(du -sh dist | cut -f1)
echo "   Total size: $TOTAL_SIZE"

echo ""
echo "✅ Build verification complete!"
echo ""
echo "To test locally, run:"
echo "   pnpm run preview"
echo ""
echo "To deploy to Netlify:"
echo "   netlify deploy --prod"
