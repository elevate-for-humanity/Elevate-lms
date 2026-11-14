#!/bin/bash
# Build Cleanup - Remove dev files from production deploy

echo "🧹 Cleaning up build output..."

# Remove markdown documentation from dist
find dist -name "*.md" -type f -delete
echo "✅ Removed .md files"

# Remove source maps (if any leaked through)
find dist -name "*.map" -type f -delete
echo "✅ Removed .map files"

# Remove test files
find dist -name "*.test.js" -type f -delete
find dist -name "*.spec.js" -type f -delete
echo "✅ Removed test files"

# Remove .DS_Store and other system files
find dist -name ".DS_Store" -type f -delete
find dist -name "Thumbs.db" -type f -delete
echo "✅ Removed system files"

# Calculate final size
DIST_SIZE=$(du -sh dist | cut -f1)
echo "📦 Final dist size: $DIST_SIZE"

echo "✅ Build cleanup complete!"
