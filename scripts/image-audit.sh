#!/bin/bash

# Image Audit Script
# Checks all image URLs on key pages

BASE_URL="${1:-http://localhost:3000}"
REPORT_DIR="reports"
mkdir -p "$REPORT_DIR"

echo "🖼️  Image Audit Tool"
echo "===================="
echo "Base URL: $BASE_URL"
echo ""

PAGES=(
  "/"
  "/store"
  "/shop"
  "/programs"
  "/lms"
  "/student-portal"
  "/employer-portal"
  "/employers"
  "/training-providers"
)

TOTAL_IMAGES=0
FAILED_IMAGES=0
FAILED_LIST=""

echo "| Page | Images | Failed |" > "$REPORT_DIR/image-audit.md"
echo "|------|--------|--------|" >> "$REPORT_DIR/image-audit.md"

for PAGE in "${PAGES[@]}"; do
  echo -n "Checking $PAGE... "
  
  # Get page HTML and extract image URLs
  HTML=$(curl -s "$BASE_URL$PAGE" 2>/dev/null)
  
  # Extract image URLs from src attributes and srcSet
  IMAGES=$(echo "$HTML" | grep -oE 'src="[^"]*\.(jpg|jpeg|png|gif|webp|svg|ico)[^"]*"' | sed 's/src="//g;s/"//g' | sort -u)
  IMAGES+=$'\n'$(echo "$HTML" | grep -oE 'src="/_next/image[^"]*"' | sed 's/src="//g;s/"//g;s/&amp;/\&/g' | sort -u)
  
  PAGE_TOTAL=0
  PAGE_FAILED=0
  
  while IFS= read -r IMG_URL; do
    [ -z "$IMG_URL" ] && continue
    
    # Make URL absolute
    if [[ "$IMG_URL" == /* ]]; then
      FULL_URL="$BASE_URL$IMG_URL"
    elif [[ "$IMG_URL" != http* ]]; then
      FULL_URL="$BASE_URL/$IMG_URL"
    else
      FULL_URL="$IMG_URL"
    fi
    
    # Check if image loads
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FULL_URL" 2>/dev/null)
    ((PAGE_TOTAL++))
    ((TOTAL_IMAGES++))
    
    if [ "$STATUS" != "200" ]; then
      ((PAGE_FAILED++))
      ((FAILED_IMAGES++))
      FAILED_LIST+="- **$PAGE**: \`$IMG_URL\` (HTTP $STATUS)\n"
    fi
  done <<< "$IMAGES"
  
  echo "$PAGE_TOTAL images, $PAGE_FAILED failed"
  echo "| $PAGE | $PAGE_TOTAL | $PAGE_FAILED |" >> "$REPORT_DIR/image-audit.md"
done

echo ""
echo "📊 Summary:"
echo "   Total images: $TOTAL_IMAGES"
echo "   Failed: $FAILED_IMAGES"
echo "   Success rate: $(echo "scale=1; ($TOTAL_IMAGES - $FAILED_IMAGES) * 100 / $TOTAL_IMAGES" | bc)%"

# Add summary to report
echo "" >> "$REPORT_DIR/image-audit.md"
echo "## Summary" >> "$REPORT_DIR/image-audit.md"
echo "- Total images: $TOTAL_IMAGES" >> "$REPORT_DIR/image-audit.md"
echo "- Failed: $FAILED_IMAGES" >> "$REPORT_DIR/image-audit.md"
echo "" >> "$REPORT_DIR/image-audit.md"

if [ $FAILED_IMAGES -gt 0 ]; then
  echo "## Failed Images" >> "$REPORT_DIR/image-audit.md"
  echo -e "$FAILED_LIST" >> "$REPORT_DIR/image-audit.md"
  echo ""
  echo "❌ Failed images:"
  echo -e "$FAILED_LIST"
fi

echo ""
echo "📄 Report saved to: $REPORT_DIR/image-audit.md"
