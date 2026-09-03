#!/usr/bin/env python3
"""
Remove 'export const dynamic = force-dynamic' from static pages that don't need it.
This will enable Next.js static generation and caching for better performance.
"""

import os
from pathlib import Path

# Pages that should remain dynamic (need real-time data)
KEEP_DYNAMIC = {
    'app/admin',
    'app/portal',
    'app/student',
    'app/instructor',
    'app/delegate',
    'app/workforce-board',
    'app/program-holder',
    'app/api',
    'app/reels/page.tsx',  # Real-time social feed
    'app/login/page.tsx',
    'app/signup',
    'app/admin-login/page.tsx',
}

def should_keep_dynamic(file_path):
    """Check if file should keep dynamic export."""
    path_str = str(file_path)
    for pattern in KEEP_DYNAMIC:
        if pattern in path_str:
            return True
    return False

def remove_dynamic_export(file_path):
    """Remove export const dynamic from file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'export const dynamic' not in content:
        return False
    
    if should_keep_dynamic(file_path):
        return False
    
    lines = content.split('\n')
    new_lines = []
    removed = False
    
    for line in lines:
        if line.strip().startswith('export const dynamic'):
            removed = True
            continue
        new_lines.append(line)
    
    if not removed:
        return False
    
    # Clean up extra blank lines
    cleaned_lines = []
    prev_blank = False
    for line in new_lines:
        is_blank = line.strip() == ''
        if is_blank and prev_blank:
            continue
        cleaned_lines.append(line)
        prev_blank = is_blank
    
    new_content = '\n'.join(cleaned_lines)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True

def main():
    """Main function."""
    app_dir = Path('app')
    removed_count = 0
    kept_count = 0
    
    for file in app_dir.rglob('*.tsx'):
        if 'export const dynamic' in file.read_text(encoding='utf-8'):
            if should_keep_dynamic(file):
                kept_count += 1
                print(f'Kept dynamic: {file}')
            elif remove_dynamic_export(file):
                removed_count += 1
                print(f'Removed dynamic: {file}')
    
    print(f'\n✅ Removed dynamic from {removed_count} static pages')
    print(f'✅ Kept dynamic on {kept_count} pages that need it')

if __name__ == '__main__':
    main()
