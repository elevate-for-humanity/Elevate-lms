#!/usr/bin/env python3
"""
Generate PWA icons in all required sizes from a source image
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

# Icon sizes required for PWA
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# Colors from brand
BRAND_COLORS = {
    'red': '#dc2626',
    'orange': '#f97316',
    'blue': '#2563eb',
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_gradient_icon(size, output_path):
    """Create a gradient icon with 'E' letter"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient (red to orange to blue)
    for y in range(size):
        # Calculate color based on position
        ratio = y / size
        if ratio < 0.5:
            # Red to orange
            r_ratio = ratio * 2
            r = int(hex_to_rgb(BRAND_COLORS['red'])[0] * (1 - r_ratio) + hex_to_rgb(BRAND_COLORS['orange'])[0] * r_ratio)
            g = int(hex_to_rgb(BRAND_COLORS['red'])[1] * (1 - r_ratio) + hex_to_rgb(BRAND_COLORS['orange'])[1] * r_ratio)
            b = int(hex_to_rgb(BRAND_COLORS['red'])[2] * (1 - r_ratio) + hex_to_rgb(BRAND_COLORS['orange'])[2] * r_ratio)
        else:
            # Orange to blue
            b_ratio = (ratio - 0.5) * 2
            r = int(hex_to_rgb(BRAND_COLORS['orange'])[0] * (1 - b_ratio) + hex_to_rgb(BRAND_COLORS['blue'])[0] * b_ratio)
            g = int(hex_to_rgb(BRAND_COLORS['orange'])[1] * (1 - b_ratio) + hex_to_rgb(BRAND_COLORS['blue'])[1] * b_ratio)
            b = int(hex_to_rgb(BRAND_COLORS['orange'])[2] * (1 - b_ratio) + hex_to_rgb(BRAND_COLORS['blue'])[2] * b_ratio)
        
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Add rounded corners
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    corner_radius = size // 8
    mask_draw.rounded_rectangle([(0, 0), (size, size)], corner_radius, fill=255)
    
    # Apply mask
    output = Image.new('RGBA', (size, size))
    output.paste(img, (0, 0))
    output.putalpha(mask)
    
    # Draw 'E' letter
    try:
        # Try to use a nice font
        font_size = int(size * 0.6)
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    draw = ImageDraw.Draw(output)
    text = 'E'
    
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center text
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    # Draw text with shadow
    shadow_offset = max(2, size // 100)
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0, 0, 0, 100))
    draw.text((x, y), text, font=font, fill='white')
    
    # Save
    output.save(output_path, 'PNG', optimize=True)
    print(f'✅ Created {output_path} ({size}x{size})')

def create_maskable_icon(size, output_path):
    """Create a maskable icon (with safe zone padding)"""
    # Maskable icons need 40% safe zone
    safe_zone = int(size * 0.2)  # 20% padding on each side
    inner_size = size - (safe_zone * 2)
    
    # Create full size image
    img = Image.new('RGBA', (size, size))
    draw = ImageDraw.Draw(img)
    
    # Fill background with gradient
    for y in range(size):
        ratio = y / size
        if ratio < 0.5:
            r_ratio = ratio * 2
            r = int(hex_to_rgb(BRAND_COLORS['red'])[0] * (1 - r_ratio) + hex_to_rgb(BRAND_COLORS['orange'])[0] * r_ratio)
            g = int(hex_to_rgb(BRAND_COLORS['red'])[1] * (1 - r_ratio) + hex_to_rgb(BRAND_COLORS['orange'])[1] * r_ratio)
            b = int(hex_to_rgb(BRAND_COLORS['red'])[2] * (1 - r_ratio) + hex_to_rgb(BRAND_COLORS['orange'])[2] * r_ratio)
        else:
            b_ratio = (ratio - 0.5) * 2
            r = int(hex_to_rgb(BRAND_COLORS['orange'])[0] * (1 - b_ratio) + hex_to_rgb(BRAND_COLORS['blue'])[0] * b_ratio)
            g = int(hex_to_rgb(BRAND_COLORS['orange'])[1] * (1 - b_ratio) + hex_to_rgb(BRAND_COLORS['blue'])[1] * b_ratio)
            b = int(hex_to_rgb(BRAND_COLORS['orange'])[2] * (1 - b_ratio) + hex_to_rgb(BRAND_COLORS['blue'])[2] * b_ratio)
        
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Draw 'E' in safe zone
    try:
        font_size = int(inner_size * 0.6)
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except:
        font = ImageFont.load_default()
    
    text = 'E'
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    shadow_offset = max(2, size // 100)
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0, 0, 0, 100))
    draw.text((x, y), text, font=font, fill='white')
    
    img.save(output_path, 'PNG', optimize=True)
    print(f'✅ Created {output_path} ({size}x{size} maskable)')

def main():
    # Get project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    public_dir = os.path.join(project_root, 'public')
    
    print('🎨 Generating PWA icons...\n')
    
    # Generate all icon sizes
    for size in ICON_SIZES:
        icon_path = os.path.join(public_dir, f'icon-{size}.png')
        create_gradient_icon(size, icon_path)
    
    # Generate maskable versions for key sizes
    maskable_sizes = [192, 512]
    print('\n🎭 Generating maskable icons...\n')
    for size in maskable_sizes:
        icon_path = os.path.join(public_dir, f'icon-{size}-maskable.png')
        create_maskable_icon(size, icon_path)
    
    # Generate favicon
    print('\n🔖 Generating favicon...\n')
    favicon_path = os.path.join(public_dir, 'favicon.png')
    create_gradient_icon(32, favicon_path)
    
    # Generate apple touch icon
    print('\n🍎 Generating Apple touch icon...\n')
    apple_icon_path = os.path.join(public_dir, 'apple-touch-icon.png')
    create_gradient_icon(180, apple_icon_path)
    
    print('\n✅ All icons generated successfully!')
    print(f'\nGenerated {len(ICON_SIZES)} standard icons')
    print(f'Generated {len(maskable_sizes)} maskable icons')
    print('Generated favicon and Apple touch icon')

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'\n❌ Error: {e}', file=sys.stderr)
        sys.exit(1)
