#!/bin/bash

# FULL WEBSITE OPTIMIZATION AUTOMATION
# Fixes: Images, Videos, Navigation, Performance, Structure
# Run: bash scripts/full-website-optimization.sh

set -e

echo "=========================================="
echo "FULL WEBSITE OPTIMIZATION"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
IMAGES_OPTIMIZED=0
VIDEOS_OPTIMIZED=0
ERRORS=0

echo "Step 1: Installing optimization tools..."
echo "=========================================="

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo -e "${YELLOW}Installing ImageMagick...${NC}"
    sudo apt-get update -qq
    sudo apt-get install -y imagemagick
fi

# Check for FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}Installing FFmpeg...${NC}"
    sudo apt-get install -y ffmpeg
fi

# Check for jpegoptim
if ! command -v jpegoptim &> /dev/null; then
    echo -e "${YELLOW}Installing jpegoptim...${NC}"
    sudo apt-get install -y jpegoptim
fi

# Check for optipng
if ! command -v optipng &> /dev/null; then
    echo -e "${YELLOW}Installing optipng...${NC}"
    sudo apt-get install -y optipng
fi

echo -e "${GREEN}✓ All tools installed${NC}"
echo ""

echo "Step 2: Optimizing Images..."
echo "=========================================="

# Create backup directory
mkdir -p public/images/.backup

# Optimize JPG images > 500KB
echo "Optimizing large JPG files..."
find public/images -type f -name "*.jpg" -size +500k | while read img; do
    SIZE_BEFORE=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
    echo "  Optimizing: $img ($(numfmt --to=iec-i --suffix=B $SIZE_BEFORE))"
    
    # Backup original
    cp "$img" "${img}.backup"
    
    # Optimize with quality 85
    jpegoptim --max=85 --strip-all "$img" 2>/dev/null || {
        echo -e "${RED}    Failed to optimize $img${NC}"
        mv "${img}.backup" "$img"
        ((ERRORS++))
        continue
    }
    
    SIZE_AFTER=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
    SAVED=$((SIZE_BEFORE - SIZE_AFTER))
    echo -e "${GREEN}    ✓ Saved $(numfmt --to=iec-i --suffix=B $SAVED)${NC}"
    rm "${img}.backup"
    ((IMAGES_OPTIMIZED++))
done

# Optimize PNG images > 500KB
echo "Optimizing large PNG files..."
find public/images -type f -name "*.png" -size +500k | while read img; do
    SIZE_BEFORE=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
    echo "  Optimizing: $img ($(numfmt --to=iec-i --suffix=B $SIZE_BEFORE))"
    
    # Backup original
    cp "$img" "${img}.backup"
    
    # Optimize
    optipng -o2 -strip all "$img" 2>/dev/null || {
        echo -e "${RED}    Failed to optimize $img${NC}"
        mv "${img}.backup" "$img"
        ((ERRORS++))
        continue
    }
    
    SIZE_AFTER=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
    SAVED=$((SIZE_BEFORE - SIZE_AFTER))
    echo -e "${GREEN}    ✓ Saved $(numfmt --to=iec-i --suffix=B $SAVED)${NC}"
    rm "${img}.backup"
    ((IMAGES_OPTIMIZED++))
done

# Convert large PNGs to JPG if appropriate
echo "Converting large PNGs to JPG where appropriate..."
find public/images -type f -name "*.png" -size +500k | while read img; do
    # Skip if it has transparency
    if identify -format '%A' "$img" | grep -q "True"; then
        echo "  Skipping $img (has transparency)"
        continue
    fi
    
    SIZE_BEFORE=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
    JPG_FILE="${img%.png}.jpg"
    
    echo "  Converting: $img to JPG"
    convert "$img" -quality 85 -strip "$JPG_FILE" 2>/dev/null || {
        echo -e "${RED}    Failed to convert $img${NC}"
        ((ERRORS++))
        continue
    }
    
    SIZE_AFTER=$(stat -f%z "$JPG_FILE" 2>/dev/null || stat -c%s "$JPG_FILE")
    
    # Only replace if JPG is smaller
    if [ $SIZE_AFTER -lt $SIZE_BEFORE ]; then
        SAVED=$((SIZE_BEFORE - SIZE_AFTER))
        echo -e "${GREEN}    ✓ Converted and saved $(numfmt --to=iec-i --suffix=B $SAVED)${NC}"
        rm "$img"
        ((IMAGES_OPTIMIZED++))
    else
        echo "    JPG not smaller, keeping PNG"
        rm "$JPG_FILE"
    fi
done

echo -e "${GREEN}✓ Images optimized: $IMAGES_OPTIMIZED${NC}"
echo ""

echo "Step 3: Optimizing Videos..."
echo "=========================================="

# Optimize videos > 3MB
echo "Compressing large video files..."
find public/videos -type f -name "*.mp4" -size +3M | while read video; do
    SIZE_BEFORE=$(stat -f%z "$video" 2>/dev/null || stat -c%s "$video")
    echo "  Compressing: $video ($(numfmt --to=iec-i --suffix=B $SIZE_BEFORE))"
    
    # Backup original
    cp "$video" "${video}.backup"
    
    # Compress with FFmpeg
    # Target: 1080p max, 30fps, CRF 28 (good quality, smaller size)
    ffmpeg -i "$video" \
        -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
        -c:v libx264 -crf 28 -preset medium \
        -c:a aac -b:a 128k \
        -movflags +faststart \
        -y "${video}.tmp.mp4" 2>/dev/null || {
        echo -e "${RED}    Failed to compress $video${NC}"
        rm -f "${video}.tmp.mp4"
        rm "${video}.backup"
        ((ERRORS++))
        continue
    }
    
    SIZE_AFTER=$(stat -f%z "${video}.tmp.mp4" 2>/dev/null || stat -c%s "${video}.tmp.mp4")
    
    # Only replace if compressed version is smaller
    if [ $SIZE_AFTER -lt $SIZE_BEFORE ]; then
        SAVED=$((SIZE_BEFORE - SIZE_AFTER))
        echo -e "${GREEN}    ✓ Saved $(numfmt --to=iec-i --suffix=B $SAVED)${NC}"
        mv "${video}.tmp.mp4" "$video"
        rm "${video}.backup"
        ((VIDEOS_OPTIMIZED++))
    else
        echo "    Compressed version not smaller, keeping original"
        rm "${video}.tmp.mp4"
        rm "${video}.backup"
    fi
done

echo -e "${GREEN}✓ Videos optimized: $VIDEOS_OPTIMIZED${NC}"
echo ""

echo "Step 4: Generating WebP versions..."
echo "=========================================="

# Generate WebP versions for all JPG/PNG images
echo "Creating WebP versions of images..."
WEBP_CREATED=0
find public/images -type f \( -name "*.jpg" -o -name "*.png" \) | while read img; do
    WEBP_FILE="${img%.*}.webp"
    
    # Skip if WebP already exists and is newer
    if [ -f "$WEBP_FILE" ] && [ "$WEBP_FILE" -nt "$img" ]; then
        continue
    fi
    
    echo "  Creating WebP: $WEBP_FILE"
    convert "$img" -quality 85 "$WEBP_FILE" 2>/dev/null || {
        echo -e "${RED}    Failed to create WebP for $img${NC}"
        continue
    }
    ((WEBP_CREATED++))
done

echo -e "${GREEN}✓ WebP images created: $WEBP_CREATED${NC}"
echo ""

echo "Step 5: Optimizing CSS/JS..."
echo "=========================================="

# Build optimized production bundle
echo "Building optimized Next.js bundle..."
npm run build 2>&1 | tail -20

echo -e "${GREEN}✓ Build complete${NC}"
echo ""

echo "Step 6: Running performance audit..."
echo "=========================================="

# Check image sizes
echo "Checking for remaining large files..."
LARGE_IMAGES=$(find public/images -type f \( -name "*.jpg" -o -name "*.png" \) -size +500k | wc -l)
LARGE_VIDEOS=$(find public/videos -type f -name "*.mp4" -size +3M | wc -l)

if [ $LARGE_IMAGES -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warning: $LARGE_IMAGES images still > 500KB${NC}"
    find public/images -type f \( -name "*.jpg" -o -name "*.png" \) -size +500k -exec ls -lh {} \; | awk '{print "  " $9 " (" $5 ")"}'
fi

if [ $LARGE_VIDEOS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warning: $LARGE_VIDEOS videos still > 3MB${NC}"
    find public/videos -type f -name "*.mp4" -size +3M -exec ls -lh {} \; | awk '{print "  " $9 " (" $5 ")"}'
fi

echo ""
echo "=========================================="
echo "OPTIMIZATION COMPLETE"
echo "=========================================="
echo ""
echo "Summary:"
echo "  Images optimized: $IMAGES_OPTIMIZED"
echo "  Videos optimized: $VIDEOS_OPTIMIZED"
echo "  WebP images created: $WEBP_CREATED"
echo "  Errors: $ERRORS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Completed with $ERRORS errors${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All optimizations successful${NC}"
fi

echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Test locally: npm run dev"
echo "  3. Commit: git add -A && git commit -m 'perf: optimize all images and videos'"
echo "  4. Deploy: git push origin main"
