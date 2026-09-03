#!/usr/bin/env python3
"""Insert auth.error guard after apiRequireAdmin assignments when missing."""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def files_missing_guard() -> list[Path]:
    out = subprocess.run(
        ["rg", "-l", "apiRequireAdmin", "app", "apps"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    paths = []
    for line in out.stdout.strip().splitlines():
        p = ROOT / line
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        if re.search(r"(auth|admin|authResult)\.error", text):
            continue
        if "apiRequireAdmin" not in text:
            continue
        paths.append(p)
    return paths


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text

    text = text.replace(
        "if (authResult instanceof NextResponse) return authResult;",
        "if (authResult.error) return authResult.error;",
    )

    lines = text.splitlines(keepends=True)
    new_lines: list[str] = []
    changed = False
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        m = re.match(r"^(\s*)const\s+(\w+)\s*=\s*await\s+apiRequireAdmin\([^)]*\);\s*$", line)
        if m:
            indent, var = m.group(1), m.group(2)
            nxt = lines[i + 1] if i + 1 < len(lines) else ""
            if f"{var}.error" not in nxt and f"{var} instanceof NextResponse" not in nxt:
                new_lines.append(f"{indent}if ({var}.error) return {var}.error;\n")
                changed = True
        i += 1

    if not changed and text == original:
        return False

    path.write_text("".join(new_lines), encoding="utf-8")
    return True


def main() -> int:
    patched = 0
    for path in files_missing_guard():
        if patch_file(path):
            print(f"patched: {path.relative_to(ROOT)}")
            patched += 1
    print(f"---\npatched {patched} file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
