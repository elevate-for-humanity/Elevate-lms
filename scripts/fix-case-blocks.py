#!/usr/bin/env python3
"""
Fix ESLint case block declaration errors by wrapping case blocks in curly braces.
"""

import re
import sys
from pathlib import Path

def fix_case_blocks(content):
    """
    Fix case blocks by adding curly braces around blocks with const/let declarations.
    """
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Check if this is a case statement
        if re.match(r'\s*case\s+[\'"]?\w+[\'"]?\s*:', line):
            # Check if next line has const/let declaration
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                if re.match(r'\s*(const|let)\s+', next_line):
                    # This case needs braces
                    # Add opening brace
                    result.append(line.rstrip() + ' {')
                    i += 1
                    
                    # Add lines until we hit break or next case/default
                    while i < len(lines):
                        current = lines[i]
                        result.append(current)
                        
                        # Check if this is a break statement
                        if re.match(r'\s*break\s*;', current):
                            # Add closing brace after break
                            result.append(result.pop().rstrip())  # Remove newline from break
                            result.append(current.rstrip())
                            # Add closing brace with same indentation as case
                            indent = len(line) - len(line.lstrip())
                            result.append(' ' * (indent + 2) + '}')
                            i += 1
                            break
                        
                        # Check if this is a return statement (no break needed)
                        if re.match(r'\s*return\s+', current):
                            # Look ahead for next case/default
                            j = i + 1
                            while j < len(lines) and not re.match(r'\s*(case|default)', lines[j]):
                                result.append(lines[j])
                                j += 1
                            # Add closing brace
                            indent = len(line) - len(line.lstrip())
                            result.append(' ' * (indent + 2) + '}')
                            i = j
                            break
                        
                        i += 1
                    continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def process_file(filepath):
    """Process a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        fixed_content = fix_case_blocks(content)
        
        if content != fixed_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"✅ Fixed: {filepath}")
            return True
        else:
            print(f"⏭️  Skipped (no changes): {filepath}")
            return False
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    """Main function."""
    files = [
        'app/api/payments/route.ts',
        'app/api/referrals/route.ts',
        'app/api/webhooks/route.ts',
        'lib/feedback.ts',
    ]
    
    base_path = Path('/workspaces/fix2')
    fixed_count = 0
    
    for file in files:
        filepath = base_path / file
        if filepath.exists():
            if process_file(filepath):
                fixed_count += 1
        else:
            print(f"⚠️  File not found: {filepath}")
    
    print(f"\n📊 Summary: Fixed {fixed_count} file(s)")
    return 0 if fixed_count > 0 else 1

if __name__ == '__main__':
    sys.exit(main())
