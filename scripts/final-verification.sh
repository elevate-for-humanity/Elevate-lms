#!/bin/bash

echo "🔍 FINAL PRODUCTION VERIFICATION"
echo "=================================="
echo ""

echo "📞 PHONE NUMBER VERIFICATION:"
echo "Searching for incorrect phone numbers..."
WRONG_PHONES=$(grep -r "555-\|123-4567\|464-4400" app lib components --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "placeholder=" | wc -l)
if [ "$WRONG_PHONES" -eq 0 ]; then
  echo "✅ No incorrect phone numbers found"
else
  echo "❌ Found $WRONG_PHONES incorrect phone numbers"
  grep -r "555-\|123-4567\|464-4400" app lib components --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "placeholder=" | head -5
fi
echo ""

echo "📧 EMAIL VERIFICATION:"
echo "Searching for incorrect emails..."
WRONG_EMAILS=$(grep -r "contact@elevateforhumanity\.org" app lib components --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "placeholder=" | wc -l)
if [ "$WRONG_EMAILS" -eq 0 ]; then
  echo "✅ No incorrect emails found"
else
  echo "⚠️  Found $WRONG_EMAILS instances of contact@elevateforhumanity.org (may be intentional)"
fi
echo ""

echo "📍 ADDRESS VERIFICATION:"
echo "Searching for incorrect addresses..."
WRONG_ADDR=$(grep -r "123 Main\|46204" app lib components --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "placeholder=" | wc -l)
if [ "$WRONG_ADDR" -eq 0 ]; then
  echo "✅ No incorrect addresses found"
else
  echo "❌ Found $WRONG_ADDR incorrect addresses"
  grep -r "123 Main\|46204" app lib components --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v "placeholder=" | head -5
fi
echo ""

echo "✅ CORRECT INFORMATION:"
echo "  Phone: (317) 314-3757"
echo "  Email: elevate4humanityedu@gmail.com"
echo "  Address: 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240"
echo ""

echo "📊 VERIFICATION SUMMARY:"
if [ "$WRONG_PHONES" -eq 0 ] && [ "$WRONG_ADDR" -eq 0 ]; then
  echo "✅ PRODUCTION READY - All contact information verified"
else
  echo "⚠️  NEEDS REVIEW - Some incorrect information found"
fi

