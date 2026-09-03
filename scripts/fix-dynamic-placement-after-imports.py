#!/usr/bin/env python3
"""
Fix placement of 'export const dynamic' to be AFTER imports but BEFORE metadata/default export.
This follows Next.js best practices for route segment config.
"""

import os
import re
from pathlib import Path

def fix_dynamic_placement(file_path):
    """Move export const dynamic to after imports."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if file has dynamic export
    if 'export const dynamic' not in content:
        return False
    
    lines = content.split('\n')
    new_lines = []
    dynamic_line = None
    use_client_lines = []
    last_import_index = -1
    
    # First pass: remove dynamic export and track use client + last import
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        if stripped.startswith('export const dynamic'):
            if not dynamic_line:
                dynamic_line = line
            continue  # Skip this line
        
        if stripped in ["'use client';", '"use client";']:
            use_client_lines.append(len(new_lines))
        
        # Track last import statement
        if stripped.startswith('import ') and ' from ' in stripped:
            last_import_index = len(new_lines)
        
        new_lines.append(line)
    
    if not dynamic_line:
        return False
    
    # Find insertion point: after last import, before metadata/default export
    insert_index = -1
    
    if last_import_index >= 0:
        # Insert after last import
        insert_index = last_import_index + 1
        
        # Skip any empty lines after imports
        while insert_index < len(new_lines) and new_lines[insert_index].strip() == '':
            insert_index += 1
    else:
        # No imports found, insert after use client or at top
        if use_client_lines:
            insert_index = use_client_lines[-1] + 1
        else:
            insert_index = 0
    
    # Insert dynamic export
    new_lines.insert(insert_index, '')
    new_lines.insert(insert_index, dynamic_line)
    
    new_content = '\n'.join(new_lines)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True

def main():
    """Main function to fix all files."""
    app_dir = Path('app')
    fixed_count = 0
    
    # Find all .tsx and .ts files
    for file in app_dir.rglob('*.tsx'):
        if fix_dynamic_placement(file):
            print(f'Fixed: {file}')
            fixed_count += 1
    
    for file in app_dir.rglob('*.ts'):
        if fix_dynamic_placement(file):
            print(f'Fixed: {file}')
            fixed_count += 1
    
    print(f'\n✅ Fixed {fixed_count} files')

if __name__ == '__main__':
    main()
