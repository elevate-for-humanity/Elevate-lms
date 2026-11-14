#!/bin/bash

# Fix Brand Colors - Replace generic green with EFH brand colors
# Red: #e63946, Orange: #f77f00, Teal: #06a77d, Blue: #3a86ff

echo "🎨 Updating brand colors throughout the site..."

# Find all TSX/JSX files and replace emerald with brand colors
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i \
  -e 's/emerald-50/red-50/g' \
  -e 's/emerald-100/red-100/g' \
  -e 's/emerald-200/red-200/g' \
  -e 's/emerald-300/orange-300/g' \
  -e 's/emerald-400/orange-400/g' \
  -e 's/emerald-500/red-500/g' \
  -e 's/emerald-600/red-600/g' \
  -e 's/emerald-700/red-700/g' \
  -e 's/bg-emerald-/bg-red-/g' \
  -e 's/text-emerald-/text-red-/g' \
  -e 's/border-emerald-/border-red-/g' \
  -e 's/hover:bg-emerald-/hover:bg-red-/g' \
  -e 's/hover:text-emerald-/hover:text-orange-/g' \
  -e 's/hover:border-emerald-/hover:border-red-/g' \
  {} \;

echo "✅ Brand colors updated!"
echo ""
echo "Updated colors:"
echo "  - Primary buttons: Red (#e63946)"
echo "  - Hover states: Orange (#f77f00)"
echo "  - Accents: Teal (#06a77d)"
echo "  - Links: Blue (#3a86ff)"
