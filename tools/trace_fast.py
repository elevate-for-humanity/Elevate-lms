"""Fast code tracer — scans files once, matches all tables via set lookup."""

import json
import re
import sys
import dataclasses
import datetime as dt
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set

AUDIT_DIR = Path("audit")
CODE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".sql", ".py", ".go"}
SKIP_DIRS = {".git", "node_modules", ".next", "dist", ".pnpm", "audit"}

# Word boundary tokenizer
WORD_RE = re.compile(r"[a-z][a-z0-9_]*", re.IGNORECASE)

# Op detection patterns
OP_PATTERNS = [
    ("INSERT", re.compile(r"\.insert\s*\(|INSERT\s+INTO", re.IGNORECASE)),
    ("UPDATE", re.compile(r"\.update\s*\(|\bUPDATE\b", re.IGNORECASE)),
    ("DELETE", re.compile(r"\.delete\s*\(|DELETE\s+FROM", re.IGNORECASE)),
    ("UPSERT", re.compile(r"\.upsert\s*\(", re.IGNORECASE)),
    ("SELECT", re.compile(r"\.select\s*\(|\bSELECT\b", re.IGNORECASE)),
    ("CREATE", re.compile(r"CREATE\s+TABLE", re.IGNORECASE)),
    ("ALTER", re.compile(r"ALTER\s+TABLE", re.IGNORECASE)),
    ("DROP", re.compile(r"DROP\s+TABLE", re.IGNORECASE)),
    ("FROM", re.compile(r"\.from\s*\(", re.IGNORECASE)),
]


def guess_op(window: str) -> str:
    for name, pat in OP_PATTERNS:
        if pat.search(window):
            return name
    return "REF"


def feature_guess(path: str) -> str:
    m = re.search(r"app/(.+?)/page\.tsx", path)
    if m: return f"Page: /{m.group(1)}"
    m = re.search(r"app/(.+?)\.tsx", path)
    if m: return f"App: {m.group(1)}"
    m = re.search(r"components/(.+?)\.tsx", path)
    if m: return f"Component: {m.group(1)}"
    m = re.search(r"lib/(.+?)\.(ts|js)", path)
    if m: return f"Lib: {m.group(1)}"
    m = re.search(r"supabase/(.+?)\.sql", path)
    if m: return f"Migration: {m.group(1)}"
    return Path(path).name


@dataclasses.dataclass
class Hit:
    table: str
    file: str
    line: int
    op: str
    snippet: str
    feature: str


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 tools/trace_fast.py <schema_snapshot.json> <root_dir>")
        sys.exit(1)

    schema_path = Path(sys.argv[1])
    root = Path(sys.argv[2]).resolve()

    schema = json.loads(schema_path.read_text())
    table_set: Set[str] = set(schema["tables"].keys())
    # Also build lowercase lookup
    table_lower: Dict[str, str] = {t.lower(): t for t in table_set}

    print(f"Loaded {len(table_set)} tables from {schema_path.name}")
    print(f"Scanning {root} ...")

    hits: List[Hit] = []
    file_count = 0

    for fp in root.rglob("*"):
        if not fp.is_file():
            continue
        if fp.suffix.lower() not in CODE_EXTS:
            continue
        if SKIP_DIRS & set(fp.parts):
            continue

        file_count += 1
        try:
            text = fp.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        lines = text.splitlines()
        rel = str(fp.relative_to(root))

        for i, line in enumerate(lines, start=1):
            # Extract all word tokens from line
            words = set(WORD_RE.findall(line))
            # Check against table set (case-insensitive)
            matched_tables = set()
            for w in words:
                canon = table_lower.get(w.lower())
                if canon:
                    matched_tables.add(canon)

            if not matched_tables:
                continue

            # Get context window
            start = max(0, i - 4)
            end = min(len(lines), i + 2)
            window = "\n".join(lines[start:end])
            op = guess_op(window)

            for t in matched_tables:
                hits.append(Hit(
                    table=t, file=rel, line=i, op=op,
                    snippet=line.strip()[:200],
                    feature=feature_guess(rel),
                ))

    # Deduplicate: same table+file+line
    seen = set()
    unique_hits = []
    for h in hits:
        key = (h.table, h.file, h.line)
        if key not in seen:
            seen.add(key)
            unique_hits.append(h)

    stamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    AUDIT_DIR.mkdir(exist_ok=True)

    # JSON
    payload = {
        "generated_at": stamp,
        "root": str(root),
        "files_scanned": file_count,
        "tables": sorted(table_set),
        "total_hits": len(unique_hits),
        "hits": [dataclasses.asdict(h) for h in unique_hits],
    }
    out_json = AUDIT_DIR / f"table_usage_{stamp}.json"
    out_json.write_text(json.dumps(payload, indent=2))

    # Markdown
    by_table: Dict[str, List[dict]] = defaultdict(list)
    for h in payload["hits"]:
        by_table[h["table"]].append(h)

    md = []
    md.append("# Table Usage (Code Trace)")
    md.append(f"- Generated: `{stamp}`")
    md.append(f"- Files scanned: {file_count}")
    md.append(f"- Total hits: {len(unique_hits)}")
    md.append(f"- Tables with refs: {len(by_table)}")
    md.append("")
    md.append("## Summary")
    md.append("| table | refs | ops |")
    md.append("|---|---:|---|")
    for t in sorted(table_set):
        th = by_table.get(t, [])
        ops = sorted({h["op"] for h in th})
        md.append(f"| `{t}` | {len(th)} | {', '.join(ops) or '-'} |")
    md.append("")

    for t in sorted(by_table.keys()):
        th = by_table[t]
        md.append(f"## {t}")
        md.append(f"**{len(th)} references**")
        md.append("")
        md.append("| op | file | line | feature | snippet |")
        md.append("|---|---|---:|---|---|")
        for h in sorted(th, key=lambda x: (x["op"], x["file"], x["line"])):
            snip = (h["snippet"] or "").replace("|", "\\|")[:120]
            md.append(f"| {h['op']} | `{h['file']}` | {h['line']} | {h['feature']} | `{snip}` |")
        md.append("")

    out_md = AUDIT_DIR / f"table_usage_{stamp}.md"
    out_md.write_text("\n".join(md))

    tables_with_refs = len(by_table)
    tables_no_refs = len(table_set) - tables_with_refs
    print(f"\nScanned {file_count} files")
    print(f"Found {len(unique_hits)} references across {tables_with_refs} tables")
    print(f"{tables_no_refs} tables have ZERO code references")
    print(f"Wrote: {out_json}")
    print(f"Wrote: {out_md}")


if __name__ == "__main__":
    main()
