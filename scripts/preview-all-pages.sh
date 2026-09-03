#!/usr/bin/env bash
# Preview All Pages - Show what each page contains

echo "📄 PREVIEWING ALL DYNAMIC PAGES"
echo "================================"
echo ""

for file in src/pages/*.jsx src/pages/*.tsx; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📄 $filename"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Show first 30 lines to see what the page does
    head -30 "$file" | grep -E "(export default|function|const|return|<h1|<h2|title|description)" | head -15
    
    echo ""
    echo "Full path: $file"
    echo ""
  fi
done
