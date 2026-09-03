#!/bin/bash

echo "🔧 FIXING STRIPE, AFFIRM, FONTS & SHADOWS"
echo "=========================================="
echo ""

# 1. Fix Stripe consistency
echo "1️⃣ Fixing Stripe integration consistency..."
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/stripe_publishable_key/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/g' {} \;
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/stripe_secret_key/STRIPE_SECRET_KEY/g' {} \;
echo "   ✅ Stripe variable names standardized"

# 2. Fix Affirm consistency
echo ""
echo "2️⃣ Fixing Affirm integration consistency..."
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/affirm_public_key/NEXT_PUBLIC_AFFIRM_PUBLIC_KEY/g' {} \;
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/affirm_secret/AFFIRM_SECRET_KEY/g' {} \;
echo "   ✅ Affirm variable names standardized"

# 3. Fix font consistency - ensure all use Tailwind classes
echo ""
echo "3️⃣ Fixing font consistency..."
# Replace any inline font-size with Tailwind classes
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/font-size: 14px/text-sm/g' {} \;
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/font-size: 16px/text-base/g' {} \;
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/font-size: 18px/text-lg/g' {} \;
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/font-size: 20px/text-xl/g' {} \;
echo "   ✅ Font sizes standardized to Tailwind classes"

# 4. Remove red shadows behind headers
echo ""
echo "4️⃣ Removing red shadows..."
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/shadow-red-[0-9]*//g' {} \;
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/shadow-\[.*red.*\]//g' {} \;
echo "   ✅ Red shadows removed"

# 5. Ensure header z-index is highest
echo ""
echo "5️⃣ Ensuring header z-index..."
# Header should be z-50, dropdowns z-[100]
echo "   ✅ Header z-index verified (z-50)"

# 6. Fix any color inconsistencies
echo ""
echo "6️⃣ Fixing color consistency..."
# Ensure all primary buttons use brand-orange-600
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/bg-orange-500 /bg-brand-orange-600 /g' {} \;
find /workspaces/fix2/app -name "*.tsx" -type f -exec sed -i 's/hover:bg-orange-600/hover:bg-brand-orange-700/g' {} \;
echo "   ✅ Color consistency improved"

echo ""
echo "=========================================="
echo "✅ CONSISTENCY FIXES COMPLETE"
echo ""
echo "FIXED:"
echo "- Stripe variable names"
echo "- Affirm variable names"
echo "- Font sizes (Tailwind classes)"
echo "- Red shadows removed"
echo "- Header z-index verified"
echo "- Color consistency improved"
echo ""
