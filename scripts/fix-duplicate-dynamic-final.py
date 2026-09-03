#!/usr/bin/env python3
"""
Remove ALL dynamic exports and add force-static properly after imports.
"""

import os
from pathlib import Path

MARKETING_PAGES = [
    'app/accreditation/page.tsx',
    'app/blog/page.tsx',
    'app/elevatelearn2earn/page.tsx',
    'app/founder/page.tsx',
    'app/partners/page.tsx',
    'app/privacy/page.tsx',
    'app/programs-lms/page.tsx',
    'app/supersonic/page.tsx',
    'app/team/page.tsx',
    'app/terms/page.tsx',
    'app/video/page.tsx',
    'app/volunteer/page.tsx',
]

def fix_file(file_path):
    """Remove all dynamic exports and add force-static after imports."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    new_lines = []
    last_import_index = -1
    
    # First pass: remove all dynamic/revalidate exports and find last import
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Skip any dynamic or revalidate export lines
        if (stripped.startswith('export const dynamic') or 
            stripped.startswith('export const revalidate')):
            continue
        
        # Track last import
        if stripped.startswith('import ') and ' from ' in stripped:
            last_import_index = len(new_lines)
        
        new_lines.append(line)
    
    # Insert force-static after last import
    if last_import_index >= 0:
        insert_pos = last_import_index + 1
        # Skip empty lines
        while insert_pos < len(new_lines) and new_lines[insert_pos].strip() == '':
            insert_pos += 1
        
        new_lines.insert(insert_pos, '')
        new_lines.insert(insert_pos, 'export const dynamic = "force-static";')
        new_lines.insert(insert_pos + 1, 'export const revalidate = 86400; // 24 hours')
    
    new_content = '\n'.join(new_lines)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True

def main():
    """Main function."""
    fixed_count = 0
    
    for page_path in MARKETING_PAGES:
        file_path = Path(page_path)
        if file_path.exists():
            fix_file(file_path)
            print(f'✅ Fixed: {page_path}')
            fixed_count += 1
        else:
            print(f'⚠️  Not found: {page_path}')
    
    print(f'\n✅ Fixed {fixed_count} pages')

if __name__ == '__main__':
    main()
