#!/bin/bash

echo "🔧 FIXING ALL GENERIC CONTENT..."
echo ""

# Fix all phone numbers
echo "📞 Fixing phone numbers..."
find app lib components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  -e 's/(555) 123-4567/(317) 314-3757/g' \
  -e 's/+15551234567/+13173143757/g' \
  -e 's/(317) 464-4400/(317) 314-3757/g' \
  {} +

echo "✅ Phone numbers fixed"

# Fix all email addresses (keep placeholders in placeholder= attributes)
echo "📧 Fixing email addresses..."
find app lib components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  -e '/placeholder=/!s/contact@elevateforhumanity\.org/elevate4humanityedu@gmail.com/g' \
  {} +

echo "✅ Email addresses fixed"

# Fix addresses
echo "📍 Fixing addresses..."
find app lib components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  -e 's/123 Main Street/8888 Keystone Crossing Suite 1300/g' \
  -e 's/City, State 12345/Indianapolis, IN 46240/g' \
  -e 's/46204/46240/g' \
  {} +

echo "✅ Addresses fixed"

echo ""
echo "✅ ALL GENERIC CONTENT FIXED"
echo ""
echo "📞 Phone: (317) 314-3757"
echo "📧 Email: elevate4humanityedu@gmail.com"
echo "📍 Address: 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240"

