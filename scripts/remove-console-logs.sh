#!/bin/bash
# Remove console.log statements from production code

echo "🧹 Removing console.log statements..."
echo ""

# Count before
BEFORE=$(grep -r "console.log" app --include="*.ts" --include="*.tsx" | wc -l)
echo "Found $BEFORE console.log statements"
echo ""

# Remove console.log statements (but keep console.error and console.warn)
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '/console\.log(/d' {} \;

# Count after
AFTER=$(grep -r "console.log" app --include="*.ts" --include="*.tsx" | wc -l)
REMOVED=$((BEFORE - AFTER))

echo "✅ Removed $REMOVED console.log statements"
echo "Remaining: $AFTER (likely in comments or strings)"
echo ""
echo "Note: console.error and console.warn were preserved for error tracking"
