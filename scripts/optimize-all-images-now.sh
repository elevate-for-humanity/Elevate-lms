#!/bin/bash
echo "🖼️  Optimizing All 798 Images..."
echo "================================"

# Check if tools are installed
if ! command -v cwebp &> /dev/null; then
    echo "Installing WebP tools..."
    sudo apt-get update -qq && sudo apt-get install -y webp imagemagick -qq
fi

# Count images
total=$(find public -type f \( -name "*.jpg" -o -name "*.png" \) | wc -l)
echo "Total images: $total"

# Find large images
large=$(find public -type f \( -name "*.jpg" -o -name "*.png" \) -size +100k | wc -l)
echo "Images over 100KB: $large"

# Optimize large images
count=0
find public -type f \( -name "*.jpg" -o -name "*.png" \) -size +100k | while read img; do
    count=$((count + 1))
    size=$(du -k "$img" | cut -f1)
    
    # Skip if WebP already exists and is smaller
    if [ -f "${img%.*}.webp" ]; then
        webp_size=$(du -k "${img%.*}.webp" 2>/dev/null | cut -f1)
        if [ ! -z "$webp_size" ] && [ $webp_size -lt 100 ]; then
            continue
        fi
    fi
    
    echo "[$count/$large] Optimizing: $img (${size}KB)"
    
    # Resize if too large
    convert "$img" -resize '1200>' "$img" 2>/dev/null
    
    # Convert to WebP
    cwebp -q 80 "$img" -o "${img%.*}.webp" 2>/dev/null
    
    # Check result
    if [ -f "${img%.*}.webp" ]; then
        webp_size=$(du -k "${img%.*}.webp" | cut -f1)
        echo "  ✅ ${size}KB → ${webp_size}KB"
    fi
done

echo ""
echo "================================"
echo "✅ Image Optimization Complete"
echo "================================"
echo "WebP images created: $(find public -name "*.webp" | wc -l)"
