#!/bin/bash

# Image Optimization Script
# Optimizes all images in the project for web delivery

set -e

echo "🖼️  Image Optimization Script"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if imagemagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${YELLOW}⚠️  ImageMagick not installed. Installing...${NC}"
    sudo apt-get update && sudo apt-get install -y imagemagick
fi

# Find all images
echo -e "${BLUE}📊 Scanning for images...${NC}"
IMAGE_DIRS=("public/images" "assets" "src/assets")
TOTAL_IMAGES=0
OPTIMIZED=0

for dir in "${IMAGE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${BLUE}Processing $dir...${NC}"
        
        # Optimize PNG files
        find "$dir" -type f -name "*.png" | while read -r file; do
            ORIGINAL_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
            
            # Optimize PNG
            convert "$file" -strip -quality 85 "$file.tmp"
            mv "$file.tmp" "$file"
            
            NEW_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
            SAVED=$((ORIGINAL_SIZE - NEW_SIZE))
            PERCENT=$((SAVED * 100 / ORIGINAL_SIZE))
            
            echo -e "${GREEN}✅ Optimized: $file (saved ${PERCENT}%)${NC}"
            ((OPTIMIZED++))
        done
        
        # Optimize JPG files
        find "$dir" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | while read -r file; do
            ORIGINAL_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
            
            # Optimize JPG
            convert "$file" -strip -quality 85 -sampling-factor 4:2:0 "$file.tmp"
            mv "$file.tmp" "$file"
            
            NEW_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
            SAVED=$((ORIGINAL_SIZE - NEW_SIZE))
            PERCENT=$((SAVED * 100 / ORIGINAL_SIZE))
            
            echo -e "${GREEN}✅ Optimized: $file (saved ${PERCENT}%)${NC}"
            ((OPTIMIZED++))
        done
        
        # Generate WebP versions
        find "$dir" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | while read -r file; do
            WEBP_FILE="${file%.*}.webp"
            if [ ! -f "$WEBP_FILE" ]; then
                convert "$file" -quality 85 "$WEBP_FILE"
                echo -e "${BLUE}📦 Created WebP: $WEBP_FILE${NC}"
            fi
        done
    fi
done

echo ""
echo -e "${GREEN}✅ Image optimization complete!${NC}"
echo -e "${BLUE}📊 Optimized $OPTIMIZED images${NC}"
echo ""
echo "Next steps:"
echo "1. Update image references to use WebP with fallbacks"
echo "2. Add lazy loading to images"
echo "3. Use responsive images with srcset"
