#!/usr/bin/env python3
"""
Strip redundant inline auth guards from admin pages.
The admin layout (app/admin/layout.tsx) already calls requireAdmin() before
any child page renders, so per-page getUser()+role+redirect blocks are dead code.

Patterns removed:
  1. supabase.auth.getUser() + if (!user) redirect('/login') block
  2. profiles role fetch + redirect('/unauthorized'|'/dashboard'|'/admin') block
  3. Unused import lines left behind by the above removals

Safe: only touches files under app/admin/. Does not remove createClient()
calls that are also used for real DB queries later in the same function.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
ADMIN_DIR = ROOT / "app" / "admin"

# Patterns to strip (as line-range blocks)
# We work line-by-line and remove contiguous blocks matching these patterns.

def strip_auth_guards(content: str) -> tuple[str, int]:
    lines = content.splitlines(keepends=True)
    out = []
    removed = 0
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Pattern 1: getUser() call
        # const { data: { user } } = await supabase.auth.getUser();
        # const { data: { user: caller } } = await supa.auth.getUser();
        if re.search(r'await \w+\.auth\.getUser\(\)', stripped):
            # Check if next non-empty line is the redirect guard
            j = i + 1
            while j < len(lines) and lines[j].strip() == '':
                j += 1
            if j < len(lines) and re.search(r"if \(.*!user.*\)\s*redirect\(", lines[j].strip()):
                # Remove getUser line + redirect line
                removed += 2
                i = j + 1
                continue

        # Pattern 2: profile role fetch for auth only
        # const { data: profile } = await [db|supabase].from('profiles').select('role')...
        # followed by: if (!profile || !['admin'...].includes(profile.role)) redirect(...)
        if re.search(r"const \{ data: profile \} = await \w+\.from\('profiles'\)\.select\('role'\)", stripped):
            j = i + 1
            while j < len(lines) and lines[j].strip() == '':
                j += 1
            if j < len(lines) and re.search(r"if \(.*profile.*role.*\)\s*(redirect\(|{)", lines[j].strip()):
                # May be single-line redirect or block redirect
                next_line = lines[j].strip()
                if next_line.endswith('{'):
                    # Block form — find closing brace
                    k = j + 1
                    depth = 1
                    while k < len(lines) and depth > 0:
                        depth += lines[k].count('{') - lines[k].count('}')
                        k += 1
                    removed += (k - i)
                    i = k
                else:
                    removed += 2
                    i = j + 1
                continue

        # Pattern 3: inline role check without separate profile fetch
        # if (!profile || !['admin', 'super_admin'].includes(profile.role)) { redirect(...) }
        # if (profile?.role !== 'admin' && ...) { redirect(...) }
        if re.search(r"if \(.*profile.*role.*\)\s*(redirect\(|{)", stripped):
            if re.search(r"redirect\('/(login|unauthorized|dashboard|admin)'", stripped):
                if stripped.endswith('{'):
                    k = i + 1
                    depth = 1
                    while k < len(lines) and depth > 0:
                        depth += lines[k].count('{') - lines[k].count('}')
                        k += 1
                    removed += (k - i)
                    i = k
                else:
                    removed += 1
                    i += 1
                continue

        # Pattern 4: if (!user) redirect('/login') standalone
        if re.search(r"if \(!user\)\s*redirect\('/(login|unauthorized)'", stripped):
            removed += 1
            i += 1
            continue

        # Pattern 5: if (!profile || ...) redirect standalone (no role check needed)
        if re.search(r"if \(!profile\s*\|\|", stripped) and re.search(r"redirect\('/(login|unauthorized|dashboard|admin)'", stripped):
            if stripped.endswith('{'):
                k = i + 1
                depth = 1
                while k < len(lines) and depth > 0:
                    depth += lines[k].count('{') - lines[k].count('}')
                    k += 1
                removed += (k - i)
                i = k
            else:
                removed += 1
                i += 1
            continue

        out.append(line)
        i += 1

    result = ''.join(out)

    # Remove unused import: import { redirect } from 'next/navigation'
    # Only if redirect is no longer used in the file for anything else
    # (keep it if there are other redirect() calls remaining)
    remaining_redirects = len(re.findall(r'\bredirect\(', result))
    import_line = re.compile(r"^import \{ redirect \} from 'next/navigation';\n", re.MULTILINE)
    if remaining_redirects == 0:
        new_result = import_line.sub('', result)
        if new_result != result:
            removed += 1
            result = new_result

    # Clean up double blank lines left by removals
    result = re.sub(r'\n{3,}', '\n\n', result)

    return result, removed


def main():
    files = list(ADMIN_DIR.rglob("page.tsx"))
    total_files = 0
    total_removed = 0

    for f in sorted(files):
        original = f.read_text(encoding='utf-8')
        modified, count = strip_auth_guards(original)
        if count > 0:
            f.write_text(modified, encoding='utf-8')
            total_files += 1
            total_removed += count
            print(f"  {count:2d} lines removed  {f.relative_to(ROOT)}")

    print(f"\nDone: {total_removed} lines removed across {total_files} files")


if __name__ == '__main__':
    main()
