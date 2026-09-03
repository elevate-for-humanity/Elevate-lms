#!/bin/bash
echo "🔧 Fixing async params in API routes..."

# Simple sed-based approach for common patterns
find app/api -name "route.ts" -type f | while read file; do
  if grep -q "{ params }: { params: { " "$file" 2>/dev/null; then
    echo "Processing: $file"
    # Backup
    cp "$file" "$file.bak"
    
    # Replace single param pattern
    sed -i 's/{ params }: { params: { \([^}]*\) } }/{ params }: { params: Promise<{ \1 }> }/g' "$file"
    
    echo "  ✅ Updated"
  fi
done

echo ""
echo "✅ Pattern replacement complete"
echo "⚠️  Manual verification needed for complex cases"
