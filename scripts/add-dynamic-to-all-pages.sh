#!/bin/bash
# Add export const dynamic to ALL page.tsx files that don't have it

find app -name "page.tsx" -type f | while read file; do
  # Check if it doesn't have dynamic export
  if ! grep -q "export const dynamic" "$file"; then
    echo "Fixing: $file"
    
    # Find the first import line
    first_import=$(grep -n "^import " "$file" | head -1 | cut -d: -f1)
    
    if [ -n "$first_import" ]; then
      # Insert before first import
      sed -i "${first_import}i\\
export const dynamic = \"force-dynamic\";\\
" "$file"
    else
      # No imports, insert at top
      sed -i "1i\\
export const dynamic = \"force-dynamic\";\\
" "$file"
    fi
  fi
done

echo "Done!"
