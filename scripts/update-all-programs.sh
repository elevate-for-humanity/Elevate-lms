#!/bin/bash

echo "🔧 Updating all 51 program pages with simple hero banners"
echo "=========================================================="
echo ""
echo "Changes:"
echo "  ✓ Remove stretched hero banners"
echo "  ✓ Add simple, contained hero sections"
echo "  ✓ Keep real images and descriptions"
echo "  ✓ Add proper CTAs"
echo "  ✓ Remove placeholders"
echo ""

# Count program pages
TOTAL=$(find app/programs -name "page.tsx" -type f | wc -l)
echo "Found $TOTAL program pages to update"
echo ""
echo "This will be done manually to ensure quality..."
