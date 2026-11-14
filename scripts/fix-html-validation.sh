#!/usr/bin/env bash
set -euo pipefail

# Fix common HTML validation issues in built files
# This script is safe to run multiple times (idempotent)

log() { printf "\n\033[1;34m▶ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m⚠ %s\033[0m\n" "$*"; }

HTML_DIRS=("dist" "build" "out" ".next")
FOUND_DIRS=()

for d in "${HTML_DIRS[@]}"; do
  [[ -d "$d" ]] && FOUND_DIRS+=("$d")
done

if [[ ${#FOUND_DIRS[@]} -eq 0 ]]; then
  warn "No HTML output directories found. Run build first."
  exit 0
fi

log "Fixing HTML validation issues in: ${FOUND_DIRS[*]}"

# Find all HTML files
HTML_FILES=()
for d in "${FOUND_DIRS[@]}"; do
  while IFS= read -r -d '' file; do
    HTML_FILES+=("$file")
  done < <(find "$d" -name "*.html" -type f -print0)
done

if [[ ${#HTML_FILES[@]} -eq 0 ]]; then
  warn "No HTML files found in output directories."
  exit 0
fi

log "Found ${#HTML_FILES[@]} HTML files to process"

FIXED_COUNT=0

for file in "${HTML_FILES[@]}"; do
  # Create backup
  cp "$file" "$file.bak"
  
  # Fix 1: Encode raw ampersands in text content (not in HTML entities)
  sed -i 's/\([^&]\)&\([^a-z#]\)/\1\&amp;\2/g' "$file"
  
  # Fix 2: Add type="button" to buttons without type attribute
  sed -i 's/<button\([^>]*\)>/<button type="button"\1>/g' "$file"
  sed -i 's/type="button" type="/type="/g' "$file"  # Remove duplicates
  
  # Fix 3: Remove trailing whitespace
  sed -i 's/[[:space:]]*$//' "$file"
  
  # Fix 4: Fix telephone number formatting (non-breaking spaces and hyphens)
  # Replace spaces in tel: links with non-breaking spaces
  sed -i 's/tel:\([0-9]\) /tel:\1\&nbsp;/g' "$file"
  sed -i 's/tel:\([0-9]\{3\}\)\&nbsp;\([0-9]\{3\}\) /tel:\1\&nbsp;\2\&nbsp;/g' "$file"
  # Replace hyphens in tel: links with non-breaking hyphens
  sed -i 's/tel:\([^"]*\)-/tel:\1\&#8209;/g' "$file"
  
  # Fix 5: Add type="text" to inputs without type
  sed -i 's/<input\([^>]*\)>/<input type="text"\1>/g' "$file"
  sed -i 's/type="text" type="/type="/g' "$file"  # Remove duplicates
  
  # Fix 6: Fix void element self-closing (remove trailing slash)
  sed -i 's/<meta\([^>]*\)\/>/<meta\1>/g' "$file"
  sed -i 's/<link\([^>]*\)\/>/<link\1>/g' "$file"
  sed -i 's/<img\([^>]*\)\/>/<img\1>/g' "$file"
  sed -i 's/<br\([^>]*\)\/>/<br\1>/g' "$file"
  sed -i 's/<hr\([^>]*\)\/>/<hr\1>/g' "$file"
  sed -i 's/<input\([^>]*\)\/>/<input\1>/g' "$file"
  
  # Check if file changed
  if ! cmp -s "$file" "$file.bak"; then
    FIXED_COUNT=$((FIXED_COUNT + 1))
  fi
  
  # Remove backup
  rm "$file.bak"
done

log "Fixed $FIXED_COUNT files"

# Run validation to check improvements
if command -v npx >/dev/null 2>&1; then
  log "Running validation check..."
  ERROR_COUNT=$(npx --yes html-validate "${FOUND_DIRS[@]}" 2>&1 | grep -c "error" || echo "0")
  log "Remaining errors: $ERROR_COUNT"
fi

log "Done! Re-run build to apply fixes to source files if needed."
