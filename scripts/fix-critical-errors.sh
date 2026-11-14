#!/usr/bin/env bash
set -euo pipefail

# Fix only critical HTML validation errors

log() { printf "\n\033[1;34m▶ %s\033[0m\n" "$*"; }

HTML_FILES=$(find dist -name "*.html" -type f 2>/dev/null || true)

if [[ -z "$HTML_FILES" ]]; then
  echo "No HTML files found"
  exit 0
fi

log "Fixing critical errors in HTML files"

for file in $HTML_FILES; do
  # Fix 1: Remove duplicate type attributes
  sed -i 's/type="\([^"]*\)" type="[^"]*"/type="\1"/g' "$file"
  sed -i 's/type="[^"]*" type="\([^"]*\)"/type="\1"/g' "$file"
  
  # Fix 2: Fix attribute quotes (single to double)
  sed -i "s/data-setup='/data-setup=\"/g" "$file"
  sed -i "s/' data-/\" data-/g" "$file"
  
  # Fix 3: Fix duplicate IDs - specifically "root"
  # Count occurrences and make unique
  awk '
  BEGIN { root_count = 0 }
  {
    line = $0
    if (match(line, /id="root"/)) {
      root_count++
      if (root_count > 1) {
        gsub(/id="root"/, "id=\"root_" root_count "\"", line)
      }
    }
    print line
  }
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

log "Done! Checking results..."

ERROR_COUNT=$(npx --yes html-validate dist/**/*.html 2>&1 | grep -c "error" || echo "0")
log "Remaining errors: $ERROR_COUNT"
