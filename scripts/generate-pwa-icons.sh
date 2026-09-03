#!/bin/bash
# Generate PWA icons from logo

set -e

echo "🎨 Generating PWA icons from logo..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."
    sudo apt-get update && sudo apt-get install -y imagemagick
fi

# Source logo
LOGO="public/logo.png"

if [ ! -f "$LOGO" ]; then
    echo "❌ Logo not found at $LOGO"
    exit 1
fi

# Icon sizes
SIZES=(72 96 128 144 152 192 384 512)

# Generate standard icons
for size in "${SIZES[@]}"; do
    echo "  Generating icon-${size}.png..."
    convert "$LOGO" -resize "${size}x${size}" "public/icon-${size}.png"
done

# Generate maskable icons (with padding)
echo "  Generating maskable icons..."
convert "$LOGO" -resize 154x154 -gravity center -extent 192x192 -background white "public/icon-192-maskable.png"
convert "$LOGO" -resize 410x410 -gravity center -extent 512x512 -background white "public/icon-512-maskable.png"

echo "✅ PWA icons generated successfully!"
echo ""
echo "Generated files:"
ls -lh public/icon-*.png
