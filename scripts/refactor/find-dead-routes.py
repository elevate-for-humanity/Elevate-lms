#!/usr/bin/env python3
"""
Detects truly dead API route handlers.
A route is dead only if it has NO exported HTTP method — not via direct export,
not via re-export, not via withApiAudit or any other wrapper pattern.
"""
from pathlib import Path
import re

METHODS = {'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'}

# Patterns that indicate a live export
LIVE_PATTERNS = [
    # Direct export: export async function POST(...)
    re.compile(r'export\s+async\s+function\s+(' + '|'.join(METHODS) + r')\b'),
    # Re-export: export { POST } from "..."
    re.compile(r'export\s*\{[^}]*\b(' + '|'.join(METHODS) + r')\b[^}]*\}'),
    # Wrapper assignment: export const POST = withApiAudit(...)
    re.compile(r'export\s+const\s+(' + '|'.join(METHODS) + r')\s*='),
    # Named export via object: exports.POST = ...
    re.compile(r'exports\.(' + '|'.join(METHODS) + r')\s*='),
]

# Patterns that indicate a 410 stub (intentionally dead)
STUB_PATTERNS = [
    re.compile(r'status.*410'),
    re.compile(r'410.*Gone'),
    re.compile(r'Gone.*410'),
]

dead = []
stubs = []

for p in sorted(Path("app").rglob("route.ts")):
    txt = p.read_text(encoding="utf-8", errors="ignore")

    is_live = any(pat.search(txt) for pat in LIVE_PATTERNS)
    is_stub = any(pat.search(txt) for pat in STUB_PATTERNS)

    if is_stub:
        stubs.append(str(p))
    elif not is_live:
        dead.append(str(p))

print(f"410 STUBS ({len(stubs)}):")
for f in stubs:
    print(f"  {f}")

print(f"\nTRULY DEAD — no exported handler ({len(dead)}):")
for f in dead:
    print(f"  {f}")

Path("scripts/refactor/dead-route-handlers.txt").write_text("\n".join(dead))
Path("scripts/refactor/stub-route-handlers.txt").write_text("\n".join(stubs))
print(f"\nWritten to scripts/refactor/dead-route-handlers.txt and stub-route-handlers.txt")
