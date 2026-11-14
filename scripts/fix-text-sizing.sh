#!/bin/bash

# Script to fix oversized text across all pages
# Reduces text-xl and text-2xl to normal sizes for body content

echo "🔧 Fixing text sizing across all pages..."

# Find all page.tsx files
find app -name "page.tsx" -type f | while read file; do
  # Skip if file doesn't exist or is empty
  if [ ! -s "$file" ]; then
    continue
  fi
  
  # Create backup
  cp "$file" "$file.bak"
  
  # Fix paragraph text sizes (not in headings)
  # text-2xl -> text-xl for paragraphs
  sed -i 's/\(<p[^>]*className="[^"]*\)text-2xl\([^"]*"[^>]*>\)/\1text-xl\2/g' "$file"
  
  # text-xl -> text-lg for paragraphs  
  sed -i 's/\(<p[^>]*className="[^"]*\)text-xl\([^"]*"[^>]*>\)/\1text-lg\2/g' "$file"
  
  # text-lg -> text-base for body paragraphs (but keep for subheadings)
  # Only change if it's in a <p> tag
  sed -i 's/\(<p[^>]*className="[^"]*\)text-lg\([^"]*"[^>]*>\)/\1text-base\2/g' "$file"
  
  # Fix section headings (h2)
  # text-4xl -> text-3xl
  sed -i 's/\(<h2[^>]*className="[^"]*\)text-4xl\([^"]*"[^>]*>\)/\1text-3xl\2/g' "$file"
  
  # text-3xl -> text-2xl for h2
  sed -i 's/\(<h2[^>]*className="[^"]*\)text-3xl\([^"]*"[^>]*>\)/\1text-2xl\2/g' "$file"
  
  # Fix h3 headings
  # text-2xl -> text-xl
  sed -i 's/\(<h3[^>]*className="[^"]*\)text-2xl\([^"]*"[^>]*>\)/\1text-xl\2/g' "$file"
  
  # text-xl -> text-lg for h3
  sed -i 's/\(<h3[^>]*className="[^"]*\)text-xl\([^"]*"[^>]*>\)/\1text-lg\2/g' "$file"
  
  # Check if file changed
  if ! cmp -s "$file" "$file.bak"; then
    echo "✅ Fixed: $file"
  fi
  
  # Remove backup
  rm "$file.bak"
done

echo ""
echo "✅ Text sizing fixes complete!"
echo "📊 Run 'git diff --stat' to see changes"
