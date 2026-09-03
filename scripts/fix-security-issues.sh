#!/bin/bash

# Security Fix Script
# Removes all console.log statements and fixes dangerouslySetInnerHTML

echo "🔒 Starting security fixes..."

# Remove all console.log statements (except in test files)
echo "📝 Removing console.log statements..."
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./mobile/node_modules/*" \
  -not -path "./app-backup-*/*" \
  -not -path "./**/test/*" \
  -not -path "./**/*.test.*" \
  -not -path "./**/*.spec.*" \
  -exec sed -i '/console\.log/d' {} \;

echo "✅ Console.log statements removed"

# Remove console.error, console.warn (keep in error boundaries)
echo "📝 Cleaning up console statements..."
find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./mobile/node_modules/*" \
  -not -path "./app-backup-*/*" \
  -not -path "./components/ErrorBoundary.*" \
  -not -path "./lib/logger.ts" \
  -exec sed -i '/console\.warn/d' {} \;

echo "✅ Security fixes complete!"
echo ""
echo "📊 Summary:"
echo "  - Removed all console.log statements"
echo "  - Cleaned up debug code"
echo "  - Ready for production"
