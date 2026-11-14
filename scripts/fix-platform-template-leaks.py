#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SCAN = [ROOT / "app", ROOT / "components"]

def fix(text: str) -> str:
    text = re.sub(
        r'alt="\{PLATFORM_DEFAULTS\.orgName\}([^"]*)"',
        r'alt={`${PLATFORM_DEFAULTS.orgName}\1`}',
        text,
    )
    text = re.sub(
        r'alt="\$\{PLATFORM_DEFAULTS\.orgName\}([^"]*)"',
        r'alt={`${PLATFORM_DEFAULTS.orgName}\1`}',
        text,
    )
    text = re.sub(
        r'aria-label="\{PLATFORM_DEFAULTS\.orgName\}([^"]*)"',
        r'aria-label={`${PLATFORM_DEFAULTS.orgName}\1`}',
        text,
    )
    text = re.sub(
        r'aria-label="\$\{PLATFORM_DEFAULTS\.orgName\}([^"]*)"',
        r'aria-label={`${PLATFORM_DEFAULTS.orgName}\1`}',
        text,
    )
    # >${PLATFORM_DEFAULTS.foo}suffix<
    def jsx_repl(m):
        prop, suffix = m.group(1), m.group(2)
        return ">{`${PLATFORM_DEFAULTS." + prop + "}" + suffix + "}`}<"
    text = re.sub(r">\$\{PLATFORM_DEFAULTS\.([a-zA-Z]+)\}([^<]*)<", jsx_repl, text)
    # '...${PLATFORM...}...'
    def sq(m):
        return "`" + m.group(1) + "${PLATFORM_DEFAULTS." + m.group(2) + "}" + m.group(3) + "`"
    text = re.sub(r"'([^']*)\$\{PLATFORM_DEFAULTS\.([a-zA-Z]+)\}([^']*)'", sq, text)
    text = re.sub(
        r'href="([^"]*)\$\{PLATFORM_DEFAULTS\.([a-zA-Z]+)\}([^"]*)"',
        r'href={`\1${PLATFORM_DEFAULTS.\2}\3`}',
        text,
    )
    text = re.sub(
        r'label="([^"]*)\$\{PLATFORM_DEFAULTS\.([a-zA-Z]+)\}([^"]*)"',
        r'label={`\1${PLATFORM_DEFAULTS.\2}\3`}',
        text,
    )
    return text

changed = []
for base in SCAN:
    for path in base.rglob("*.tsx"):
        t = path.read_text()
        u = fix(t)
        if u != t:
            path.write_text(u)
            changed.append(path)
print("updated", len(changed))
