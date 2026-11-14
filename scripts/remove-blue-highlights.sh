#!/bin/bash
# scripts/remove-blue-highlights.sh
# Remove blue highlight backgrounds from hover states across the site

set -e

echo "🎨 Removing Blue Highlights from Site"
echo "======================================"
echo ""

# Count occurrences before
BEFORE=$(grep -r "hover:bg-blue-50" components/ app/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l)
echo "Found $BEFORE instances of hover:bg-blue-50"

# Replace hover:bg-blue-50 with hover:bg-gray-50
echo "Replacing hover:bg-blue-50 → hover:bg-gray-50..."
find components/ app/ -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/hover:bg-blue-50/hover:bg-gray-50/g' {} \;

# Replace hover:bg-blue-100 with hover:bg-gray-100
echo "Replacing hover:bg-blue-100 → hover:bg-gray-100..."
find components/ app/ -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/hover:bg-blue-100/hover:bg-gray-100/g' {} \;

# Replace active:bg-blue-100 with active:bg-gray-100
echo "Replacing active:bg-blue-100 → active:bg-gray-100..."
find components/ app/ -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/active:bg-blue-100/active:bg-gray-100/g' {} \;

# Replace active:bg-blue-50 with active:bg-gray-50
echo "Replacing active:bg-blue-50 → active:bg-gray-50..."
find components/ app/ -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/active:bg-blue-50/active:bg-gray-50/g' {} \;

# Count occurrences after
AFTER=$(grep -r "hover:bg-blue-50" components/ app/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l)
echo ""
echo "✅ Replaced $((BEFORE - AFTER)) instances"
echo "Remaining: $AFTER"

if [ $AFTER -eq 0 ]; then
    echo "✅ All blue highlights removed!"
else
    echo "⚠️  Some blue highlights remain (may be intentional)"
fi

echo ""
echo "Note: This script only removes background highlights."
echo "Text colors (hover:text-blue-600) are preserved for links."
