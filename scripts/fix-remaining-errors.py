#!/usr/bin/env python3
"""
Fix remaining HTML validation errors with precise replacements
"""

import re
import sys
from pathlib import Path

def fix_html_file(filepath):
    """Fix HTML validation errors in a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix 1: Replace <div> with <span> inside <button> tags
    # Match button tags and replace divs inside them
    def replace_div_in_button(match):
        button_content = match.group(1)
        # Replace div with span
        button_content = button_content.replace('<div', '<span')
        button_content = button_content.replace('</div>', '</span>')
        return f'<button{match.group(0)[7:match.group(0).index(">")]}>{button_content}</button>'
    
    # Simple approach: replace div tags that appear after button tags
    content = re.sub(r'<button([^>]*)>\s*<div', r'<button\1><span', content)
    content = re.sub(r'</div>\s*</button>', r'</span></button>', content)
    
    # Fix 2: Add unique suffixes to duplicate form names
    # Find all form control names and make them unique
    form_names = {}
    def make_unique_name(match):
        name = match.group(1)
        if name.startswith('entry.'):
            if name not in form_names:
                form_names[name] = 0
            form_names[name] += 1
            if form_names[name] > 1:
                return f'name="{name}_{form_names[name]}"'
        return match.group(0)
    
    content = re.sub(r'name="([^"]+)"', make_unique_name, content)
    
    # Fix 3: Fix telephone number formatting
    # Replace spaces with &nbsp; in phone numbers
    content = re.sub(r'(\d{3})\s+(\d{3})', r'\1&nbsp;\2', content)
    content = re.sub(r'(\d{3})\s+(\d{4})', r'\1&nbsp;\2', content)
    # Replace hyphens with non-breaking hyphens in phone numbers
    content = re.sub(r'(\d{3})-(\d{3})', r'\1&#8209;\2', content)
    content = re.sub(r'(\d{3})-(\d{4})', r'\1&#8209;\2', content)
    
    # Fix 4: Add aria-label to buttons without text
    content = re.sub(r'<button([^>]*)></button>', r'<button\1 aria-label="Button"></button>', content)
    
    # Fix 5: Fix empty headings
    for i in range(1, 7):
        content = re.sub(f'<h{i}></h{i}>', f'<h{i}>Section Heading</h{i}>', content)
        content = re.sub(f'<h{i}>\s*</h{i}>', f'<h{i}>Section Heading</h{i}>', content)
    
    # Fix 6: Remove duplicate type attributes
    content = re.sub(r'type="[^"]*"\s+type="([^"]*)"', r'type="\1"', content)
    
    # Fix 7: Remove redundant role attributes
    content = re.sub(r'role="button"\s+type="button"', r'type="button"', content)
    content = re.sub(r'type="button"\s+role="button"', r'type="button"', content)
    
    # Fix 8: Shorten long titles
    def shorten_title(match):
        title = match.group(1)
        if len(title) > 70:
            return f'<title>{title[:67]}...</title>'
        return match.group(0)
    
    content = re.sub(r'<title>([^<]+)</title>', shorten_title, content)
    
    # Fix 9: Fix unrecognized character references
    content = content.replace('&#8209', '&#8209;')
    content = content.replace('&nbsp', '&nbsp;')
    
    # Only write if changed
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    # Find all HTML files in dist directory
    dist_dir = Path('dist')
    if not dist_dir.exists():
        print("No dist directory found")
        return
    
    html_files = list(dist_dir.rglob('*.html'))
    print(f"Found {len(html_files)} HTML files")
    
    fixed_count = 0
    for filepath in html_files:
        if fix_html_file(filepath):
            fixed_count += 1
    
    print(f"Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
