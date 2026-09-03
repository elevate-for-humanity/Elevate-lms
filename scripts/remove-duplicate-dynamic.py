#!/usr/bin/env python3
"""
Remove all 'export const dynamic' declarations and place one at the top.
"""

import os
import re
from pathlib import Path

def fix_duplicate_dynamic(file_path):
    """Remove all dynamic exports and place one at the top of the file (after 'use client' if present)."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if file has dynamic export
    if 'export const dynamic' not in content:
        return False
    
    lines = content.split('\n')
    new_lines = []
    dynamic_line = None
    use_client_index = -1
    
    # Remove all dynamic export lines and find 'use client' directive
    for i, line in enumerate(lines):
        if line.strip().startswith('export const dynamic'):
            if not dynamic_line:
                dynamic_line = line
        elif line.strip() in ["'use client';", '"use client";']:
            use_client_index = len(new_lines)
            new_lines.append(line)
        else:
            new_lines.append(line)
    
    if not dynamic_line:
        return False
    
    # Insert after 'use client' if present, otherwise at the top
    if use_client_index >= 0:
        # Insert after 'use client' directive
        insert_pos = use_client_index + 1
        # Skip any empty lines after 'use client'
        while insert_pos < len(new_lines) and new_lines[insert_pos].strip() == '':
            insert_pos += 1
        new_lines.insert(insert_pos, '')
        new_lines.insert(insert_pos, dynamic_line)
    else:
        # Insert at the very top
        new_lines.insert(0, dynamic_line)
        new_lines.insert(1, '')
    
    new_content = '\n'.join(new_lines)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True

def main():
    """Main function to fix all page.tsx files."""
    app_dir = Path('app')
    fixed_count = 0
    
    # Find all .tsx files
    for tsx_file in app_dir.rglob('*.tsx'):
        if fix_duplicate_dynamic(tsx_file):
            print(f'Fixed: {tsx_file}')
            fixed_count += 1
    
    print(f'\n✅ Fixed {fixed_count} files')

if __name__ == '__main__':
    main()
