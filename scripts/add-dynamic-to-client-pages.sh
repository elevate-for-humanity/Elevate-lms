#!/bin/bash
# Add export const dynamic to all client component pages that don't have it

find app -name "page.tsx" -type f | while read file; do
  # Check if it's a client component and doesn't have dynamic export
  if grep -q "'use client'" "$file" && ! grep -q "export const dynamic" "$file"; then
    echo "Fixing: $file"
    # Insert after 'use client';
    sed -i "/'use client';/a\\
\\
export const dynamic = \"force-dynamic\";" "$file"
  fi
done

echo "Done!"
