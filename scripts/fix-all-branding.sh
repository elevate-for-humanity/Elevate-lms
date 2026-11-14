#!/bin/bash

# Complete Branding Fix Script
# Updates colors, contact info, and fixes all placeholders

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🎨 Fixing All Branding & Contact Information            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Real contact information from repository
REAL_PHONE="(317) 760-7908"
REAL_EMAIL="elizabethpowell6262@gmail.com"
REAL_ADDRESS="7009 E 56th St Ste F, Indianapolis, IN 46226"
REAL_CONTACT="Elizabeth Greene"

# Brand colors from branding/brand.css
# Red: #e63946
# Orange: #f77f00
# Teal: #06a77d
# Blue: #3a86ff
# Purple: #7209b7

echo "Step 1: Updating contact information..."

# Update phone numbers
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i \
  -e "s/(317) 555-1234/$REAL_PHONE/g" \
  -e "s/317-555-1234/$REAL_PHONE/g" \
  -e "s/\+13175551234/+13177607908/g" \
  {} \;

# Update email addresses
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i \
  -e "s/info@elevateforhumanity.org/$REAL_EMAIL/g" \
  -e "s/privacy@elevateforhumanity.org/$REAL_EMAIL/g" \
  -e "s/support@elevateforhumanity.org/$REAL_EMAIL/g" \
  {} \;

# Update address
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i \
  -e "s/Marion County, Indiana/$REAL_ADDRESS/g" \
  {} \;

echo "✅ Contact information updated"
echo ""

echo "Step 2: Updating brand colors (emerald → red/orange/teal/blue)..."

# Replace emerald with brand colors
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i \
  -e 's/bg-emerald-50/bg-red-50/g' \
  -e 's/bg-emerald-100/bg-red-100/g' \
  -e 's/bg-emerald-500/bg-red-500/g' \
  -e 's/bg-emerald-600/bg-red-600/g' \
  -e 's/bg-emerald-700/bg-red-700/g' \
  -e 's/text-emerald-300/text-orange-300/g' \
  -e 's/text-emerald-400/text-orange-400/g' \
  -e 's/text-emerald-600/text-red-600/g' \
  -e 's/text-emerald-700/text-red-700/g' \
  -e 's/border-emerald-200/border-red-200/g' \
  -e 's/border-emerald-300/border-red-300/g' \
  -e 's/border-emerald-600/border-red-600/g' \
  -e 's/hover:bg-emerald-50/hover:bg-orange-50/g' \
  -e 's/hover:bg-emerald-500/hover:bg-red-500/g' \
  -e 's/hover:bg-emerald-600/hover:bg-red-600/g' \
  -e 's/hover:bg-emerald-700/hover:bg-red-700/g' \
  -e 's/hover:text-emerald-300/hover:text-orange-300/g' \
  -e 's/hover:text-emerald-600/hover:text-red-600/g' \
  -e 's/hover:text-emerald-700/hover:text-red-700/g' \
  -e 's/hover:border-emerald-600/hover:border-red-600/g' \
  -e 's/from-emerald-50/from-red-50/g' \
  -e 's/from-emerald-600/from-red-600/g' \
  -e 's/from-emerald-700/from-red-700/g' \
  -e 's/to-emerald-700/to-red-700/g' \
  {} \;

echo "✅ Brand colors updated"
echo ""

echo "Step 3: Summary of changes..."
echo ""
echo "Updated Information:"
echo "  Phone: $REAL_PHONE"
echo "  Email: $REAL_EMAIL"
echo "  Address: $REAL_ADDRESS"
echo "  Contact: $REAL_CONTACT"
echo ""
echo "Updated Colors:"
echo "  Primary: Red (#e63946)"
echo "  Hover: Orange (#f77f00)"
echo "  Success: Teal (#06a77d)"
echo "  Info: Blue (#3a86ff)"
echo ""
echo "✅ All branding fixes complete!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test locally: npm run dev"
echo "  3. Commit: git add -A && git commit -m 'Fix branding'"
echo "  4. Deploy: git push origin main"
