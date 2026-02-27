#!/usr/bin/env python3
"""
Validate that .insert() calls to governed tables use columns that exist
in the live schema. Focuses on inserts (the highest-risk surface) since
.eq()/.select() have too many false positives from method chaining.

Uses scripts/governed-schema.json as the source of truth.
Exit 0 = clean, Exit 1 = mismatches found.
"""
import json, re, os, sys

SCHEMA_FILE = os.path.join(os.path.dirname(__file__), 'governed-schema.json')
SCAN_DIRS = ['app', 'lib']
EXTENSIONS = ('.ts', '.tsx')

SKIP_WORDS = {
    'const', 'let', 'var', 'if', 'else', 'return', 'await', 'async', 'try',
    'catch', 'function', 'data', 'error', 'null', 'true', 'false', 'default',
    'new', 'this', 'throw', 'case', 'break', 'switch', 'for', 'while', 'do',
    'class', 'import', 'export', 'from', 'of', 'in', 'typeof', 'instanceof',
}

def load_schema():
    with open(SCHEMA_FILE) as f:
        return json.load(f)

def find_insert_mismatches(schema):
    issues = []
    insert_pattern = re.compile(r"from\(['\"](\w+)['\"]\)\s*\n?\s*\.insert\(")

    for scan_dir in SCAN_DIRS:
        for root, dirs, files in os.walk(scan_dir):
            dirs[:] = [d for d in dirs if d not in ('node_modules', '.next')]
            for fname in files:
                if not fname.endswith(EXTENSIONS):
                    continue
                fpath = os.path.join(root, fname)
                with open(fpath) as f:
                    content = f.read()

                for match in insert_pattern.finditer(content):
                    table = match.group(1)
                    if table not in schema:
                        continue

                    valid_cols = set(schema[table])
                    start = match.end()
                    brace_start = content.find('{', start)
                    if brace_start == -1 or brace_start - start > 20:
                        continue

                    # Find matching closing brace
                    depth = 0
                    pos = brace_start
                    insert_block = ''
                    while pos < len(content):
                        ch = content[pos]
                        if ch == '{':
                            depth += 1
                        elif ch == '}':
                            depth -= 1
                            if depth == 0:
                                insert_block = content[brace_start:pos+1]
                                break
                        pos += 1

                    if not insert_block:
                        continue

                    # Extract top-level keys only (not nested object keys)
                    inner = insert_block[1:-1]
                    depth = 0
                    top_keys = []
                    i = 0
                    current_key = ''
                    while i < len(inner):
                        ch = inner[i]
                        if ch in ('{', '[', '('):
                            depth += 1
                        elif ch in ('}', ']', ')'):
                            depth -= 1
                        elif ch == ':' and depth == 0 and current_key.strip():
                            key = current_key.strip().split('\n')[-1].strip()
                            if '//' in key:
                                key = key.split('//')[-1].strip()
                            top_keys.append(key)
                            current_key = ''
                            i += 1
                            while i < len(inner):
                                ch2 = inner[i]
                                if ch2 in ('{', '[', '('):
                                    depth += 1
                                elif ch2 in ('}', ']', ')'):
                                    depth -= 1
                                elif ch2 == ',' and depth == 0:
                                    break
                                i += 1
                            current_key = ''
                        else:
                            current_key += ch
                        i += 1

                    line_num = content[:match.start()].count('\n') + 1

                    for key in top_keys:
                        key = key.strip()
                        if not key or key in SKIP_WORDS or key.startswith('...'):
                            continue
                        if key not in valid_cols:
                            issues.append(
                                f"   \u274c {fpath}:{line_num} \u2014 insert column '{key}' "
                                f"not in {table} schema"
                            )

    return issues

if __name__ == '__main__':
    schema = load_schema()
    issues = find_insert_mismatches(schema)
    if issues:
        for issue in issues:
            print(issue)
        print(f"   Fix: Update column names to match live schema (scripts/governed-schema.json)")
        sys.exit(1)
    sys.exit(0)
