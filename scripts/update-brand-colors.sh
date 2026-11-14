#!/bin/bash

# Update Brand Colors Across All Pages
# This script replaces old color classes with new brand color classes

echo "🎨 Updating brand colors across all pages..."

# Find all TSX files
find /workspaces/fix2/app -name "*.tsx" -type f | while read file; do
    # Skip node_modules
    if [[ $file == *"node_modules"* ]]; then
        continue
    fi
    
    # Orange colors
    sed -i 's/text-orange-500/text-brand-orange-600/g' "$file"
    sed -i 's/text-orange-600/text-brand-orange-600/g' "$file"
    sed -i 's/bg-orange-500/bg-brand-orange-600/g' "$file"
    sed -i 's/bg-orange-600/bg-brand-orange-600/g' "$file"
    sed -i 's/hover:text-orange-600/hover:text-brand-orange-700/g' "$file"
    sed -i 's/hover:text-orange-700/hover:text-brand-orange-700/g' "$file"
    sed -i 's/hover:bg-orange-600/hover:bg-brand-orange-700/g' "$file"
    sed -i 's/hover:bg-orange-700/hover:bg-brand-orange-700/g' "$file"
    sed -i 's/border-orange-600/border-brand-orange-600/g' "$file"
    
    # Blue colors
    sed -i 's/text-blue-600/text-brand-blue-600/g' "$file"
    sed -i 's/bg-blue-600/bg-brand-blue-600/g' "$file"
    sed -i 's/bg-blue-700/bg-brand-blue-700/g' "$file"
    sed -i 's/hover:text-blue-700/hover:text-brand-blue-700/g' "$file"
    sed -i 's/hover:bg-blue-700/hover:bg-brand-blue-700/g' "$file"
    sed -i 's/border-blue-600/border-brand-blue-600/g' "$file"
    
    # Green colors (success states)
    sed -i 's/text-green-600/text-brand-green-600/g' "$file"
    sed -i 's/bg-green-600/bg-brand-green-600/g' "$file"
    sed -i 's/bg-green-100/bg-brand-green-100/g' "$file"
    sed -i 's/border-green-600/border-brand-green-600/g' "$file"
done

echo "✅ Brand colors updated!"
echo ""
echo "Summary:"
echo "- Orange: text/bg-orange-* → text/bg-brand-orange-*"
echo "- Blue: text/bg-blue-* → text/bg-brand-blue-*"
echo "- Green: text/bg-green-* → text/bg-brand-green-*"
echo ""
echo "⚠️  Please review changes before committing!"
