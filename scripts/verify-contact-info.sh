#!/bin/bash

# Verify Contact Information Across Codebase
# Checks for correct phone, email, and address

echo "🔍 VERIFYING CONTACT INFORMATION..."
echo ""

CORRECT_PHONE="(317) 314-3757"
CORRECT_EMAIL="elevate4humanityedu@gmail.com"
CORRECT_ADDRESS="8888 Keystone Crossing Suite 1300"

echo "✅ CORRECT INFORMATION:"
echo "  Phone: $CORRECT_PHONE"
echo "  Email: $CORRECT_EMAIL"
echo "  Address: $CORRECT_ADDRESS"
echo ""

echo "🔍 Searching for incorrect phone numbers..."
grep -r "(317)" app lib components --include="*.tsx" --include="*.ts" 2>/dev/null | \
  grep -v "node_modules" | \
  grep -v "$CORRECT_PHONE" | \
  grep -v "placeholder" | \
  head -10

echo ""
echo "🔍 Searching for incorrect email addresses..."
grep -r "@" app lib components --include="*.tsx" --include="*.ts" 2>/dev/null | \
  grep -v "node_modules" | \
  grep -v "$CORRECT_EMAIL" | \
  grep -v "noreply@" | \
  grep -v "example@" | \
  grep -v "placeholder" | \
  grep -v "mailto:" | \
  grep -v "import" | \
  head -10

echo ""
echo "✅ VERIFICATION COMPLETE"
echo ""
echo "📞 Contact: $CORRECT_PHONE"
echo "📧 Email: $CORRECT_EMAIL"
echo "📍 Address: $CORRECT_ADDRESS, Indianapolis, IN 46240"

