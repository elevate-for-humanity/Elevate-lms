#!/bin/bash

# Process and distribute images across the site

echo "🎨 Processing and distributing images..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Installing..."
    sudo apt-get update && sudo apt-get install -y imagemagick
fi

# Create output directories
mkdir -p public/images/artlist/variations
mkdir -p public/images/artlist/cropped
mkdir -p public/images/artlist/thumbnails

echo ""
echo "📸 Creating image variations..."

# Process each image
for img in public/images/artlist/hero-training-*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img" .jpg)
        echo "Processing $filename..."
        
        # Create square crop for cards (800x800)
        convert "$img" -resize 800x800^ -gravity center -extent 800x800 \
            "public/images/artlist/cropped/${filename}-square.jpg"
        
        # Create wide crop for banners (1920x600)
        convert "$img" -resize 1920x600^ -gravity center -extent 1920x600 \
            "public/images/artlist/cropped/${filename}-wide.jpg"
        
        # Create portrait crop for sidebars (600x800)
        convert "$img" -resize 600x800^ -gravity center -extent 600x800 \
            "public/images/artlist/cropped/${filename}-portrait.jpg"
        
        # Create thumbnail (400x300)
        convert "$img" -resize 400x300^ -gravity center -extent 400x300 \
            "public/images/artlist/thumbnails/${filename}-thumb.jpg"
        
        # Create variations with different brightness/contrast
        convert "$img" -brightness-contrast 5x5 \
            "public/images/artlist/variations/${filename}-bright.jpg"
        
        convert "$img" -brightness-contrast -5x10 \
            "public/images/artlist/variations/${filename}-contrast.jpg"
        
        echo "  ✅ Created 6 variations for $filename"
    fi
done

echo ""
echo "📊 Image Statistics:"
echo "Original images: $(ls -1 public/images/artlist/hero-training-*.jpg 2>/dev/null | wc -l)"
echo "Square crops: $(ls -1 public/images/artlist/cropped/*-square.jpg 2>/dev/null | wc -l)"
echo "Wide crops: $(ls -1 public/images/artlist/cropped/*-wide.jpg 2>/dev/null | wc -l)"
echo "Portrait crops: $(ls -1 public/images/artlist/cropped/*-portrait.jpg 2>/dev/null | wc -l)"
echo "Thumbnails: $(ls -1 public/images/artlist/thumbnails/*-thumb.jpg 2>/dev/null | wc -l)"
echo "Variations: $(ls -1 public/images/artlist/variations/*.jpg 2>/dev/null | wc -l)"

echo ""
echo "💾 Total disk usage:"
du -sh public/images/artlist/

echo ""
echo "✨ Image processing complete!"
echo ""
echo "📁 Available image sets:"
echo "  - Original: public/images/artlist/hero-training-*.jpg"
echo "  - Square (800x800): public/images/artlist/cropped/*-square.jpg"
echo "  - Wide (1920x600): public/images/artlist/cropped/*-wide.jpg"
echo "  - Portrait (600x800): public/images/artlist/cropped/*-portrait.jpg"
echo "  - Thumbnails (400x300): public/images/artlist/thumbnails/*-thumb.jpg"
echo "  - Variations: public/images/artlist/variations/*.jpg"
