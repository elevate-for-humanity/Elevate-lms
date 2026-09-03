#!/bin/bash

# Vercel Deployment Decision Script
# Returns exit code 1 to SKIP deployment
# Returns exit code 0 to PROCEED with deployment

# Get list of changed files
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")

# If no changes detected, deploy (safety fallback)
if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No git history available - deploying"
  exit 0
fi

# Patterns that should NOT trigger deployment
DOCS_ONLY_PATTERNS=(
  "*.md"
  "docs/"
  "LICENSE"
  "CHANGELOG"
  ".github/workflows/"
  ".vscode/"
  ".gitignore"
  ".prettierrc"
  ".eslintrc"
)

# Check if ALL changes are documentation-only
ALL_DOCS=true
while IFS= read -r file; do
  IS_DOCS=false
  
  for pattern in "${DOCS_ONLY_PATTERNS[@]}"; do
    if [[ "$file" == $pattern ]]; then
      IS_DOCS=true
      break
    fi
  done
  
  if [ "$IS_DOCS" = false ]; then
    ALL_DOCS=false
    break
  fi
done <<< "$CHANGED_FILES"

# If all changes are docs, skip deployment
if [ "$ALL_DOCS" = true ]; then
  echo "📝 Only documentation changed - skipping deployment"
  exit 1
fi

# Otherwise, proceed with deployment
echo "✅ Code changes detected - proceeding with deployment"
exit 0
