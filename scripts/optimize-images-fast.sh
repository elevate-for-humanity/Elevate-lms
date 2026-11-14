#!/bin/bash
echo "🖼️  Optimizing Images..."

# Install WebP if not installed
if ! command -v cwebp &> /dev/null; then
    echo "Installing WebP tools..."
    sudo apt-get update -qq && sudo apt-get install -y webp imagemagick
fi

# Count images to optimize
total=$(find public -type f \( -name "*.jpg" -o -name "*.png" \) -size +100k | wc -l)
echo "Found $total images over 100KB"

# Optimize in parallel
find public -type f \( -name "*.jpg" -o -name "*.png" \) -size +100k | while read img; do
    size=$(du -k "$img" | cut -f1)
    echo "Optimizing: $img (${size}KB)"
    
    # Resize if too large
    convert "$img" -resize '1200>' "$img" 2>/dev/null
    
    # Convert to WebP
    cwebp -q 80 "$img" -o "${img%.*}.webp" 2>/dev/null
    
    # Remove original if WebP is smaller
    webp_size=$(du -k "${img%.*}.webp" 2>/dev/null | cut -f1)
    if [ ! -z "$webp_size" ] && [ $webp_size -lt 100 ]; then
        echo "✅ ${size}KB → ${webp_size}KB"
    fi
done

echo "✅ Image optimization complete"
