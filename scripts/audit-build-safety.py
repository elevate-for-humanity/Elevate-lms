#!/usr/bin/env python3
"""
Build safety audit for Elevate LMS.

Catches the classes of errors that break Netlify builds before they are pushed:
  1. export const dynamic/runtime injected inside import blocks
  2. Duplicate named imports in the same file (Turbopack "defined multiple times")
  3. lucide-react Image colliding with next/image Image
  4. React hooks (useI18n, useState, etc.) called in server components
  5. new Image() / raw browser globals in non-client files
  6. Severe brace imbalance (truncated files)

Exit 0 = clean. Exit 1 = failures found.
"""

import re
import glob
import sys
from collections import defaultdict

ERRORS = []
WARNINGS = []

def err(msg):
    ERRORS.append(msg)

def warn(msg):
    WARNINGS.append(msg)

def is_client(src):
    return "'use client'" in src[:300] or '"use client"' in src[:300]

def is_api_route(path):
    return path.startswith('app/api/')

def all_tsx():
    return sorted(
        glob.glob('app/**/*.tsx', recursive=True) +
        glob.glob('app/**/*.ts', recursive=True) +
        glob.glob('components/**/*.tsx', recursive=True)
    )

def all_lib():
    return sorted(glob.glob('lib/**/*.ts', recursive=True))

# ── 1. export const inside import block ──────────────────────────────────────
def check_export_const_injection():
    count = 0
    for path in all_tsx():
        try:
            lines = open(path).readlines()
        except Exception:
            continue
        for i, line in enumerate(lines):
            if re.match(r'^export\s+const\s+(dynamic|runtime|revalidate)\s*=', line):
                if i > 0:
                    prev = lines[i - 1].rstrip()
                    if re.search(r'[{,]\s*$', prev) and 'from' not in prev and not prev.strip().startswith('//'):
                        err(f"[export-injection] {path}:{i+1} — 'export const' inside import block (prev: {prev.strip()[:60]})")
                        count += 1
    return count

# ── 2. Duplicate named imports ────────────────────────────────────────────────
def check_duplicate_imports():
    count = 0
    for path in all_tsx():
        try:
            src = open(path).read()
        except Exception:
            continue
        names = []
        for m in re.finditer(r'import\s+(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s*from', src, re.DOTALL):
            if m.group(1):
                names.append(m.group(1))
            if m.group(2):
                for item in re.split(r',', m.group(2)):
                    item = item.strip()
                    if not item:
                        continue
                    alias = re.match(r'\w+\s+as\s+(\w+)', item)
                    local = alias.group(1) if alias else item.strip()
                    if local and re.match(r'^\w+$', local):
                        names.append(local)
        dupes = sorted(set(n for n in names if names.count(n) > 1))
        if dupes:
            err(f"[dup-import] {path} — duplicate names: {dupes}")
            count += 1
    return count

# ── 3. lucide Image vs next/image Image ──────────────────────────────────────
def check_image_collision():
    count = 0
    for path in all_tsx():
        try:
            src = open(path).read()
        except Exception:
            continue
        has_next_image = bool(re.search(r"from\s+['\"]next/image['\"]", src))
        lucide_block = re.search(r'import\s*\{([^}]+)\}\s*from\s*[\'"]lucide-react[\'"]', src, re.DOTALL)
        has_lucide_image = False
        if lucide_block:
            if re.search(r'\bImage\b(?!\s+as\b)', lucide_block.group(1)):
                has_lucide_image = True
        if has_next_image and has_lucide_image:
            err(f"[image-collision] {path} — 'Image' imported from both next/image and lucide-react")
            count += 1
    return count

# ── 4. Hooks in server components ─────────────────────────────────────────────
HOOK_RE = re.compile(r'\b(useI18n|useTheme|useToast|useAuth|useUser|useSession|useState|useEffect|useRef|useCallback|useMemo|useRouter|usePathname|useSearchParams)\s*\(')

def check_hooks_in_server():
    count = 0
    for path in all_tsx():
        try:
            src = open(path).read()
        except Exception:
            continue
        if is_client(src) or is_api_route(path):
            continue
        lines = src.split('\n')
        hits = [(i+1, l.strip()) for i, l in enumerate(lines)
                if HOOK_RE.search(l) and not l.strip().startswith('//')]
        if hits:
            for ln, line in hits[:2]:
                err(f"[hook-in-server] {path}:{ln} — {line[:100]}")
            count += 1
    return count

# ── 5. new Image() in non-client files ───────────────────────────────────────
def check_new_image():
    count = 0
    for path in all_tsx() + all_lib():
        try:
            src = open(path).read()
        except Exception:
            continue
        if is_client(src) or is_api_route(path):
            continue
        lines = src.split('\n')
        hits = [(i+1, l.strip()) for i, l in enumerate(lines)
                if re.search(r'\bnew\s+Image\s*\(', l) and not l.strip().startswith('//')]
        if hits:
            for ln, line in hits:
                err(f"[new-Image-server] {path}:{ln} — {line[:100]}")
            count += 1
    return count

# ── 6. Brace imbalance (truncated files) ─────────────────────────────────────
def check_brace_balance():
    count = 0
    for path in all_tsx():
        try:
            src = open(path).read()
        except Exception:
            continue
        diff = src.count('{') - src.count('}')
        if abs(diff) > 5:
            err(f"[brace-imbalance] {path} — opens={src.count('{')}, closes={src.count('}')}, diff={diff:+d}")
            count += 1
    return count

# ── 7. page.tsx missing default export ───────────────────────────────────────
def check_missing_default_export():
    count = 0
    for path in glob.glob('app/**/page.tsx', recursive=True):
        try:
            src = open(path).read()
        except Exception:
            continue
        # re-exports like `export { default } from '...'` are valid
        has_default = bool(
            re.search(r'export\s+default\s+', src) or
            re.search(r'export\s*\{\s*default\s*\}', src)
        )
        if not has_default:
            err(f"[missing-default-export] {path}")
            count += 1
    return count

# ── 8. JSX returned from generateMetadata (body in wrong function) ────────────
def check_jsx_in_generate_metadata():
    count = 0
    for path in glob.glob('app/**/page.tsx', recursive=True):
        try:
            src = open(path).read()
        except Exception:
            continue
        # Find generateMetadata function body and check if it returns JSX
        m = re.search(r'export\s+async\s+function\s+generateMetadata\b[^{]*\{(.+?)^\}',
                      src, re.DOTALL | re.MULTILINE)
        if m and re.search(r'return\s*\(\s*<', m.group(1)):
            err(f"[jsx-in-generateMetadata] {path} — JSX returned from generateMetadata instead of page component")
            count += 1
    return count

# ── Run all checks ────────────────────────────────────────────────────────────
print("Running build safety audit...")
print()

checks = [
    ("export const injection",        check_export_const_injection),
    ("duplicate imports",             check_duplicate_imports),
    ("Image name collision",          check_image_collision),
    ("hooks in server files",         check_hooks_in_server),
    ("new Image() server-side",       check_new_image),
    ("brace imbalance",               check_brace_balance),
    ("page missing default export",   check_missing_default_export),
    ("JSX inside generateMetadata",   check_jsx_in_generate_metadata),
]

for label, fn in checks:
    n = fn()
    status = "✅" if n == 0 else "❌"
    print(f"  {status}  {label}: {n} issue(s)")

print()

if ERRORS:
    print(f"FAILED — {len(ERRORS)} error(s):\n")
    for e in ERRORS:
        print(f"  {e}")
    sys.exit(1)
else:
    print("PASSED — no build-breaking issues found.")
    sys.exit(0)
