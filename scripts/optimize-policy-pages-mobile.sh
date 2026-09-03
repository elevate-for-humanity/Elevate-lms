#!/bin/bash
# scripts/optimize-policy-pages-mobile.sh
# Optimize policy pages for mobile by reducing padding

set -e

echo "📱 Optimizing Policy Pages for Mobile"
echo "======================================"
echo ""

# Find all policy pages
POLICY_PAGES=$(find app/academic-integrity app/policies app/privacy-policy app/refund-policy -name "page.tsx" 2>/dev/null)

echo "Found policy pages:"
echo "$POLICY_PAGES"
echo ""

# Replace large padding with responsive padding
echo "Optimizing padding for mobile..."

# p-8 → p-4 sm:p-6 md:p-8 (responsive padding)
find app/academic-integrity app/policies app/privacy-policy app/refund-policy -name "page.tsx" -type f -exec sed -i 's/className="\([^"]*\)p-8\([^"]*\)"/className="\1p-4 sm:p-6 md:p-8\2"/g' {} \;

# p-6 → p-4 sm:p-6 (responsive padding)
find app/academic-integrity app/policies app/privacy-policy app/refund-policy -name "page.tsx" -type f -exec sed -i 's/className="\([^"]*\)p-6\([^"]*\)"/className="\1p-4 sm:p-6\2"/g' {} \;

# px-6 py-12 → px-4 py-8 sm:px-6 sm:py-12 (responsive padding)
find app/academic-integrity app/policies app/privacy-policy app/refund-policy -name "page.tsx" -type f -exec sed -i 's/px-6 py-12/px-4 py-8 sm:px-6 sm:py-12/g' {} \;

# px-8 → px-4 sm:px-6 md:px-8 (responsive horizontal padding)
find app/academic-integrity app/policies app/privacy-policy app/refund-policy -name "page.tsx" -type f -exec sed -i 's/className="\([^"]*\)px-8\([^"]*\)"/className="\1px-4 sm:px-6 md:px-8\2"/g' {} \;

# py-8 → py-6 sm:py-8 (responsive vertical padding)
find app/academic-integrity app/policies app/privacy-policy app/refund-policy -name "page.tsx" -type f -exec sed -i 's/className="\([^"]*\)py-8\([^"]*\)"/className="\1py-6 sm:py-8\2"/g' {} \;

# text-2xl → text-xl sm:text-2xl (responsive headings)
find app/academic-integrity app/policies app/privacy-policy app/refund-policy -name "page.tsx" -type f -exec sed -i 's/text-2xl font-bold/text-xl sm:text-2xl font-bold/g' {} \;

# text-lg → text-base sm:text-lg (responsive subheadings)
find app/academic-integrity app/policies app/privacy-policy app/refund-policy -name "page.tsx" -type f -exec sed -i 's/text-lg font-bold/text-base sm:text-lg font-bold/g' {} \;

echo "✅ Optimized padding and text sizes for mobile"
echo ""
echo "Changes made:"
echo "- p-8 → p-4 sm:p-6 md:p-8"
echo "- px-6 py-12 → px-4 py-8 sm:px-6 sm:py-12"
echo "- text-2xl → text-xl sm:text-2xl"
echo "- text-lg → text-base sm:text-lg"
echo ""
echo "✅ Policy pages now mobile-optimized!"
