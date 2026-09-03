#!/usr/bin/env python3
"""
Add force-static and revalidate to marketing pages for better caching.
"""

import os
from pathlib import Path

# Marketing pages that should be force-static
MARKETING_PAGES = [
    'app/page.tsx',
    'app/founder/page.tsx',
    'app/programs-lms/page.tsx',
    'app/accreditation/page.tsx',
    'app/terms/page.tsx',
    'app/privacy/page.tsx',
    'app/supersonic/page.tsx',
    'app/volunteer/page.tsx',
    'app/team/page.tsx',
    'app/partners/page.tsx',
    'app/video/page.tsx',
    'app/booking/page.tsx',
    'app/contact/page.tsx',
    'app/blog/page.tsx',
    'app/faq/page.tsx',
    'app/advising/page.tsx',
    'app/partner-with-us/page.tsx',
    'app/elevatelearn2earn/page.tsx',
]

def add_force_static(file_path):
    """Add force-static and revalidate exports to a file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has force-static
    if 'force-static' in content:
        return False
    
    # Check if it's a client component
    if "'use client'" in content or '"use client"' in content:
        print(f'Skipping {file_path} - client component')
        return False
    
    lines = content.split('\n')
    new_lines = []
    inserted = False
    
    # Find where to insert (after imports, before metadata/default export)
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # Insert after last import
        if not inserted and line.strip().startswith('import ') and ' from ' in line:
            # Check if next line is not an import
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if not (next_line.startswith('import ') and ' from ' in next_line):
                    new_lines.append('')
                    new_lines.append('export const dynamic = "force-static";')
                    new_lines.append('export const revalidate = 86400; // 24 hours')
                    inserted = True
    
    if not inserted:
        return False
    
    new_content = '\n'.join(new_lines)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True

def main():
    """Main function."""
    added_count = 0
    
    for page_path in MARKETING_PAGES:
        file_path = Path(page_path)
        if file_path.exists():
            if add_force_static(file_path):
                print(f'✅ Added force-static: {page_path}')
                added_count += 1
        else:
            print(f'⚠️  Not found: {page_path}')
    
    print(f'\n✅ Added force-static to {added_count} pages')

if __name__ == '__main__':
    main()
