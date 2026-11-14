#!/usr/bin/env python3
"""
Fix oversized text across all page.tsx files
Reduces text-xl and text-2xl to normal sizes for body content
"""

import os
import re
from pathlib import Path

def fix_text_sizing(file_path):
    """Fix text sizing in a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix paragraph text (not headings)
    # text-2xl in <p> tags -> text-xl
    content = re.sub(
        r'(<p[^>]*className="[^"]*?)text-2xl([^"]*")',
        r'\1text-xl\2',
        content
    )
    
    # text-xl in <p> tags -> text-base or text-lg
    content = re.sub(
        r'(<p[^>]*className="[^"]*?)text-xl([^"]*")',
        r'\1text-base md:text-lg\2',
        content
    )
    
    # Fix <h2> headings
    # text-5xl -> text-4xl
    content = re.sub(
        r'(<h2[^>]*className="[^"]*?)text-5xl([^"]*")',
        r'\1text-3xl md:text-4xl\2',
        content
    )
    
    # text-4xl -> text-3xl
    content = re.sub(
        r'(<h2[^>]*className="[^"]*?)text-4xl([^"]*")',
        r'\1text-2xl md:text-3xl\2',
        content
    )
    
    # text-3xl -> text-2xl
    content = re.sub(
        r'(<h2[^>]*className="[^"]*?)text-3xl([^"]*")',
        r'\1text-2xl md:text-3xl\2',
        content
    )
    
    # Fix <h3> headings
    # text-2xl -> text-xl
    content = re.sub(
        r'(<h3[^>]*className="[^"]*?)text-2xl([^"]*")',
        r'\1text-lg md:text-xl\2',
        content
    )
    
    # text-xl -> text-lg
    content = re.sub(
        r'(<h3[^>]*className="[^"]*?)text-xl([^"]*")',
        r'\1text-lg\2',
        content
    )
    
    # Fix div/span text that's too large (body content)
    # Only if it contains actual text content indicators
    content = re.sub(
        r'(<(?:div|span)[^>]*className="[^"]*?)text-xl([^"]*"[^>]*>(?!<h|<button))',
        r'\1text-base\2',
        content
    )
    
    # Write back if changed
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Process all page.tsx files"""
    print("🔧 Fixing text sizing across all pages...")
    
    app_dir = Path('app')
    fixed_count = 0
    total_count = 0
    
    # Find all page.tsx files
    for page_file in app_dir.rglob('page.tsx'):
        total_count += 1
        if fix_text_sizing(page_file):
            fixed_count += 1
            print(f"✅ Fixed: {page_file}")
    
    print(f"\n✅ Complete!")
    print(f"📊 Fixed {fixed_count} out of {total_count} files")
    print(f"💡 Run 'git diff --stat' to see changes")

if __name__ == '__main__':
    main()
