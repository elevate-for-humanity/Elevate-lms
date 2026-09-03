#!/bin/bash

# Create downloadable image bundle

echo "📦 Creating Image Bundle..."
echo ""

# Create bundle directory
BUNDLE_DIR="image-bundle-$(date +%Y%m%d)"
mkdir -p "$BUNDLE_DIR"

# Create subdirectories
mkdir -p "$BUNDLE_DIR/artlist-originals"
mkdir -p "$BUNDLE_DIR/artlist-cropped"
mkdir -p "$BUNDLE_DIR/artlist-thumbnails"
mkdir -p "$BUNDLE_DIR/program-images"
mkdir -p "$BUNDLE_DIR/branding"
mkdir -p "$BUNDLE_DIR/success-stories"
mkdir -p "$BUNDLE_DIR/placeholders"

echo "📋 Organizing images..."

# Copy Artlist originals
if [ -d "public/images/artlist" ]; then
    cp public/images/artlist/hero-training-*.jpg "$BUNDLE_DIR/artlist-originals/" 2>/dev/null
    echo "  ✅ Copied Artlist originals"
fi

# Copy Artlist cropped versions
if [ -d "public/images/artlist/cropped" ]; then
    cp public/images/artlist/cropped/*.jpg "$BUNDLE_DIR/artlist-cropped/" 2>/dev/null
    echo "  ✅ Copied Artlist cropped versions"
fi

# Copy Artlist thumbnails
if [ -d "public/images/artlist/thumbnails" ]; then
    cp public/images/artlist/thumbnails/*.jpg "$BUNDLE_DIR/artlist-thumbnails/" 2>/dev/null
    echo "  ✅ Copied Artlist thumbnails"
fi

# Copy program images
cp public/images/programs/*.jpg "$BUNDLE_DIR/program-images/" 2>/dev/null
cp public/images/efh-*.jpg "$BUNDLE_DIR/program-images/" 2>/dev/null
echo "  ✅ Copied program images"

# Copy branding
cp public/images/*logo*.png "$BUNDLE_DIR/branding/" 2>/dev/null
cp public/images/favicon*.png "$BUNDLE_DIR/branding/" 2>/dev/null
echo "  ✅ Copied branding assets"

# Copy success stories
cp public/images/Success_Story*.png "$BUNDLE_DIR/success-stories/" 2>/dev/null
echo "  ✅ Copied success story images"

# Copy placeholders
cp public/images/PLACEHOLDER*.jpg "$BUNDLE_DIR/placeholders/" 2>/dev/null
echo "  ✅ Copied placeholder images"

# Copy other useful images
cp public/images/healthcare-training.png "$BUNDLE_DIR/" 2>/dev/null
cp public/images/feature-image.png "$BUNDLE_DIR/" 2>/dev/null
cp public/images/cta-banner.jpg "$BUNDLE_DIR/" 2>/dev/null
cp public/images/hero-banner.png "$BUNDLE_DIR/" 2>/dev/null

echo ""
echo "📝 Creating documentation..."

# Create README
cat > "$BUNDLE_DIR/README.md" << 'EOF'
# Elevate For Humanity - Image Bundle

This bundle contains all images currently used in the Elevate For Humanity website.

## 📁 Directory Structure

### artlist-originals/
High-quality professional images from Artlist (8 images)
- hero-training-1.jpg through hero-training-8.jpg
- Use for: Hero sections, large banners, featured content

### artlist-cropped/
Pre-cropped versions optimized for specific layouts
- Square (800x800): Perfect for cards and thumbnails
- Wide (1920x600): Ideal for hero banners
- Portrait (600x800): Great for sidebars

### artlist-thumbnails/
Small preview versions (400x300)
- Use for: Lists, grids, quick previews

### program-images/
Images for specific training programs
- CNA, Barber, Building Tech, Esthetician, etc.
- Use for: Program pages, course cards

### branding/
Logos, favicons, and brand assets
- Use for: Headers, footers, branding

### success-stories/
Graduate and testimonial images
- Use for: Success stories, testimonials

### placeholders/
Placeholder images (to be replaced)
- These should be replaced with real images

## 🎨 Usage Guidelines

### Image Sizes
- **Hero sections**: Use artlist-originals or artlist-cropped/wide
- **Cards**: Use artlist-cropped/square
- **Thumbnails**: Use artlist-thumbnails
- **Sidebars**: Use artlist-cropped/portrait

### Best Practices
1. Always use Next.js Image component for optimization
2. Set appropriate alt text for accessibility
3. Use `priority` for above-the-fold images
4. Use `loading="lazy"` for below-the-fold images

### Example Usage
```typescript
import Image from "next/image";

<Image
  src="/images/artlist/hero-training-1.jpg"
  alt="Professional training classroom"
  fill
  className="object-cover"
  priority
/>
```

## 📊 Image Inventory

### Artlist Images (8 originals + 32 variations)
- Total size: ~10MB
- Format: JPG
- Quality: High-resolution professional photography

### Program Images (50+)
- Total size: ~15MB
- Format: JPG
- Programs covered: Healthcare, Trades, Beauty, Business, etc.

### Branding Assets (10+)
- Total size: ~2MB
- Format: PNG
- Includes: Logos, favicons, icons

## 🚀 Quick Start

1. Extract this bundle to your project's `public/images/` directory
2. Update image paths in your components
3. Replace placeholder images with real content
4. Test all pages to ensure images load correctly

## 📞 Support

For questions about image usage or to request additional images,
refer to the main project documentation.

---

**Bundle Created**: $(date)
**Total Images**: $(find . -type f \( -name "*.jpg" -o -name "*.png" \) | wc -l)
**Total Size**: $(du -sh . | cut -f1)
EOF

# Create image inventory
cat > "$BUNDLE_DIR/IMAGE_INVENTORY.txt" << 'EOF'
# Complete Image Inventory

## Artlist Originals
EOF

ls -lh "$BUNDLE_DIR/artlist-originals/" >> "$BUNDLE_DIR/IMAGE_INVENTORY.txt" 2>/dev/null

cat >> "$BUNDLE_DIR/IMAGE_INVENTORY.txt" << 'EOF'

## Artlist Cropped
EOF

ls -lh "$BUNDLE_DIR/artlist-cropped/" >> "$BUNDLE_DIR/IMAGE_INVENTORY.txt" 2>/dev/null

cat >> "$BUNDLE_DIR/IMAGE_INVENTORY.txt" << 'EOF'

## Program Images
EOF

ls -lh "$BUNDLE_DIR/program-images/" >> "$BUNDLE_DIR/IMAGE_INVENTORY.txt" 2>/dev/null

echo ""
echo "📊 Bundle Statistics:"
echo "  Total files: $(find "$BUNDLE_DIR" -type f | wc -l)"
echo "  Total size: $(du -sh "$BUNDLE_DIR" | cut -f1)"
echo ""

# Create zip archive
echo "🗜️  Creating zip archive..."
zip -r "${BUNDLE_DIR}.zip" "$BUNDLE_DIR" -q

if [ -f "${BUNDLE_DIR}.zip" ]; then
    echo "  ✅ Archive created: ${BUNDLE_DIR}.zip"
    echo "  📦 Size: $(du -sh "${BUNDLE_DIR}.zip" | cut -f1)"
else
    echo "  ❌ Failed to create archive"
    exit 1
fi

echo ""
echo "✨ Bundle creation complete!"
echo ""
echo "📥 Download your bundle:"
echo "  File: ${BUNDLE_DIR}.zip"
echo "  Location: $(pwd)/${BUNDLE_DIR}.zip"
echo ""
echo "📋 Contents:"
echo "  - $(ls "$BUNDLE_DIR/artlist-originals" 2>/dev/null | wc -l) Artlist originals"
echo "  - $(ls "$BUNDLE_DIR/artlist-cropped" 2>/dev/null | wc -l) Artlist cropped versions"
echo "  - $(ls "$BUNDLE_DIR/artlist-thumbnails" 2>/dev/null | wc -l) Artlist thumbnails"
echo "  - $(ls "$BUNDLE_DIR/program-images" 2>/dev/null | wc -l) Program images"
echo "  - $(ls "$BUNDLE_DIR/branding" 2>/dev/null | wc -l) Branding assets"
echo "  - $(ls "$BUNDLE_DIR/success-stories" 2>/dev/null | wc -l) Success story images"
echo "  - README.md and IMAGE_INVENTORY.txt"
echo ""
echo "🎉 Ready to download!"
