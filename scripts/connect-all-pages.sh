#!/bin/bash

# Script to identify and list all pages that need database connection updates
# This will help us batch process them

echo "Scanning for pages that need updates..."

# Find all pages querying 'profiles' as template data
echo "=== Pages querying profiles (likely templates) ==="
find app -name "*.tsx" -type f -exec grep -l "from('profiles')" {} \; | wc -l

# Find all admin pages
echo "=== Admin pages ==="
find app/admin -name "page.tsx" | wc -l

# Find all student pages
echo "=== Student pages ==="
find app/student -name "page.tsx" | wc -l

# Find all staff pages
echo "=== Staff portal pages ==="
find app/staff-portal -name "page.tsx" | wc -l

# Find all partner pages
echo "=== Partner portal pages ==="
find app/partner -name "page.tsx" | wc -l

# Find all employer pages
echo "=== Employer portal pages ==="
find app/employer -name "page.tsx" | wc -l

echo ""
echo "Creating list of pages to update..."

# Create a list of all pages that query profiles
find app -name "*.tsx" -type f -exec grep -l "from('profiles')" {} \; > /tmp/pages_to_update.txt

echo "Found $(wc -l < /tmp/pages_to_update.txt) pages to review"
echo "List saved to /tmp/pages_to_update.txt"
