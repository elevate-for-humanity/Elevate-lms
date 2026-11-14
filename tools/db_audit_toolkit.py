"""
DB Audit Toolkit (Supabase REST + Code Trace)

Connects via Supabase REST API (no direct Postgres needed).

Usage:
  export SUPABASE_URL="https://xxx.supabase.co"
  export SUPABASE_SERVICE_KEY="eyJ..."

  python3 tools/db_audit_toolkit.py schema --all
  python3 tools/db_audit_toolkit.py trace --from-schema-json audit/schema_snapshot_*.json --root .
  python3 tools/db_audit_toolkit.py report --schema-json audit/schema_snapshot_*.json --usage-json audit/table_usage_*.json

Outputs under ./audit/
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import json
import os
import re
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import httpx

AUDIT_DIR = Path("audit")


def _now_stamp() -> str:
    return dt.datetime.now().strftime("%Y%m%d_%H%M%S")


def _ensure_audit_dir() -> None:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)


def _sb_url() -> str:
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    if not url:
        raise SystemExit("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
    return url.rstrip("/")


def _sb_key() -> str:
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise SystemExit("Missing SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY")
    return key


def _headers() -> dict:
    key = _sb_key()
    return {"apikey": key, "Authorization": f"Bearer {key}"}


def schema_snapshot(all_tables: bool, tables_csv: Optional[str]) -> Path:
    _ensure_audit_dir()
    stamp = _now_stamp()
    out_json = AUDIT_DIR / f"schema_snapshot_{stamp}.json"
    out_md = AUDIT_DIR / f"schema_snapshot_{stamp}.md"

    url = _sb_url()
    print(f"Fetching OpenAPI spec from {url}/rest/v1/ ...")
    resp = httpx.get(f"{url}/rest/v1/", headers=_headers(), timeout=30)
    resp.raise_for_status()
    spec = resp.json()
    definitions = spec.get("definitions", {})

    if all_tables:
        table_names = sorted(definitions.keys())
    elif tables_csv:
        table_names = [t.strip() for t in tables_csv.split(",") if t.strip()]
    else:
        raise SystemExit("Provide --all or --tables")

    print(f"Counting rows for {len(table_names)} tables ...")
    row_counts: Dict[str, int] = {}
    client = httpx.Client(timeout=10)
    for t in table_names:
        try:
            r = client.get(
                f"{url}/rest/v1/{t}?select=*&limit=1",
                headers={**_headers(), "Prefer": "count=exact"},
            )
            cr = r.headers.get("content-range", "")
            row_counts[t] = int(cr.split("/")[1]) if "/" in cr else 0
        except Exception:
            row_counts[t] = -1
    client.close()

    snapshot: Dict[str, Any] = {
        "generated_at": stamp,
        "table_count": len(table_names),
        "tables": {},
    }

    for t in table_names:
        defn = definitions.get(t, {})
        props = defn.get("properties", {})
        required = set(defn.get("required", []))
        columns = []
        for i, (col_name, col_info) in enumerate(props.items(), start=1):
            columns.append({
                "ordinal_position": i,
                "column_name": col_name,
                "data_type": col_info.get("type", "unknown"),
                "format": col_info.get("format", ""),
                "description": col_info.get("description", ""),
                "is_nullable": col_name not in required,
                "column_default": col_info.get("default"),
                "maxLength": col_info.get("maxLength"),
                "enum": col_info.get("enum"),
            })
        snapshot["tables"][t] = {
            "table_name": t,
            "row_count": row_counts.get(t, 0),
            "column_count": len(columns),
            "columns": columns,
        }

    out_json.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    out_md.write_text(_snapshot_to_markdown(snapshot), encoding="utf-8")

    populated = sum(1 for v in snapshot["tables"].values() if v["row_count"] > 0)
    empty = sum(1 for v in snapshot["tables"].values() if v["row_count"] == 0)
    print(f"\nSnapshot: {len(table_names)} tables ({populated} populated, {empty} empty)")
    print(f"Wrote: {out_json}")
    print(f"Wrote: {out_md}")
    return out_json


def _snapshot_to_markdown(snapshot: Dict[str, Any]) -> str:
    lines: List[str] = []
    lines.append("# Schema Snapshot")
    lines.append(f"- Generated: `{snapshot['generated_at']}`")
    lines.append(f"- Tables: {snapshot['table_count']}")
    lines.append("")
    lines.append("## Summary")
    lines.append("| table | columns | rows |")
    lines.append("|---|---:|---:|")
    for t, info in snapshot["tables"].items():
        lines.append(f"| `{t}` | {info['column_count']} | {info['row_count']} |")
    lines.append("")
    for t, info in snapshot["tables"].items():
        lines.append(f"## {t}")
        lines.append(f"- Rows: **{info['row_count']}** | Columns: **{info['column_count']}**")
        lines.append("")
        cols = info["columns"]
        if not cols:
            lines.append("_No columns found._")
            lines.append("")
            continue
        lines.append("| # | column | type | format | nullable | default |")
        lines.append("|---:|---|---|---|---|---|")
        for c in cols:
            default = str(c.get("column_default") or "")[:60]
            nullable = "YES" if c.get("is_nullable") else "NO"
            lines.append(
                f"| {c['ordinal_position']} | `{c['column_name']}` | `{c['data_type']}` | `{c.get('format','')}` | {nullable} | `{default}` |"
            )
        lines.append("")
    return "\n".join(lines)


# ─── Code tracing ───────────────────────────────────────────────────────────

CODE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".sql", ".py", ".go"}

SUPABASE_OP_PATTERNS: List[Tuple[str, re.Pattern[str]]] = [
    ("INSERT", re.compile(r"\.insert\s*\(")),
    ("UPDATE", re.compile(r"\.update\s*\(")),
    ("DELETE", re.compile(r"\.delete\s*\(")),
    ("UPSERT", re.compile(r"\.upsert\s*\(")),
    ("SELECT", re.compile(r"\.select\s*\(")),
    ("FROM", re.compile(r"\.from\s*\(")),
    ("RPC", re.compile(r"\.rpc\s*\(")),
]

SQL_OP_PATTERNS: List[Tuple[str, re.Pattern[str]]] = [
    ("INSERT", re.compile(r"\bINSERT\s+INTO\b", re.IGNORECASE)),
    ("UPDATE", re.compile(r"\bUPDATE\b", re.IGNORECASE)),
    ("DELETE", re.compile(r"\bDELETE\s+FROM\b", re.IGNORECASE)),
    ("SELECT", re.compile(r"\bSELECT\b", re.IGNORECASE)),
    ("CREATE", re.compile(r"\bCREATE\s+TABLE\b", re.IGNORECASE)),
    ("ALTER", re.compile(r"\bALTER\s+TABLE\b", re.IGNORECASE)),
    ("DROP", re.compile(r"\bDROP\s+TABLE\b", re.IGNORECASE)),
    ("JOIN", re.compile(r"\bJOIN\b", re.IGNORECASE)),
]


def _iter_code_files(root: Path) -> Iterable[Path]:
    skip_dirs = {".git", "node_modules", ".next", "dist", ".pnpm", "audit"}
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in CODE_EXTS:
            continue
        if skip_dirs & set(p.parts):
            continue
        yield p


def _guess_op(window: str) -> str:
    for name, pat in SUPABASE_OP_PATTERNS:
        if pat.search(window):
            return name
    for name, pat in SQL_OP_PATTERNS:
        if pat.search(window):
            return name
    return "REF"


def _feature_guess(path_str: str) -> str:
    s = path_str.replace("\\", "/")
    m = re.search(r"app/(.+?)/page\.tsx", s)
    if m:
        return f"Page: /{m.group(1)}"
    m = re.search(r"app/(.+?)\.tsx", s)
    if m:
        return f"App: {m.group(1)}"
    m = re.search(r"components/(.+?)\.tsx", s)
    if m:
        return f"Component: {m.group(1)}"
    m = re.search(r"lib/(.+?)\.(ts|js)", s)
    if m:
        return f"Lib: {m.group(1)}"
    m = re.search(r"netlify/(.+?)\.(ts|js)", s)
    if m:
        return f"Netlify: {m.group(1)}"
    m = re.search(r"supabase/(.+?)\.sql", s)
    if m:
        return f"Migration: {m.group(1)}"
    return Path(s).name


def trace_tables(root: Path, tables: List[str]) -> Path:
    _ensure_audit_dir()
    stamp = _now_stamp()
    out_json = AUDIT_DIR / f"table_usage_{stamp}.json"
    out_md = AUDIT_DIR / f"table_usage_{stamp}.md"

    table_patterns = {
        t: re.compile(rf"(?<![a-zA-Z0-9_]){re.escape(t)}(?![a-zA-Z0-9_])")
        for t in tables
    }

    @dataclasses.dataclass
    class Hit:
        table: str
        file: str
        line: int
        op: str
        snippet: str
        feature: str

    hits: List[Hit] = []
    file_count = 0

    print(f"Scanning {root} for references to {len(tables)} tables ...")
    for fp in _iter_code_files(root):
        file_count += 1
        try:
            text = fp.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        file_lines = text.splitlines()

        for i, line in enumerate(file_lines, start=1):
            for t, pat in table_patterns.items():
                if not pat.search(line):
                    continue
                start = max(0, i - 4)
                end = min(len(file_lines), i + 2)
                window = "\n".join(file_lines[start:end])
                op = _guess_op(window)
                rel_path = str(fp.relative_to(root)) if fp.is_relative_to(root) else str(fp)
                hits.append(Hit(
                    table=t, file=rel_path, line=i, op=op,
                    snippet=line.strip()[:200],
                    feature=_feature_guess(rel_path),
                ))

    payload: Dict[str, Any] = {
        "generated_at": stamp,
        "root": str(root),
        "files_scanned": file_count,
        "tables": tables,
        "total_hits": len(hits),
        "hits": [dataclasses.asdict(h) for h in hits],
    }

    out_json.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    out_md.write_text(_usage_to_markdown(payload), encoding="utf-8")

    tables_with_refs = len({h.table for h in hits})
    print(f"\nScanned {file_count} files, found {len(hits)} references across {tables_with_refs} tables")
    print(f"Wrote: {out_json}")
    print(f"Wrote: {out_md}")
    return out_json


def _usage_to_markdown(payload: Dict[str, Any]) -> str:
    lines: List[str] = []
    lines.append("# Table Usage (Code Trace)")
    lines.append(f"- Generated: `{payload['generated_at']}`")
    lines.append(f"- Files scanned: {payload['files_scanned']}")
    lines.append(f"- Total hits: {payload['total_hits']}")
    lines.append("")
    by_table: Dict[str, List[Dict]] = defaultdict(list)
    for h in payload["hits"]:
        by_table[h["table"]].append(h)
    lines.append("## Summary")
    lines.append("| table | refs | ops |")
    lines.append("|---|---:|---|")
    for t in payload["tables"]:
        th = by_table.get(t, [])
        ops = sorted({h["op"] for h in th})
        lines.append(f"| `{t}` | {len(th)} | {', '.join(ops) if ops else '-'} |")
    lines.append("")
    for t in payload["tables"]:
        th = by_table.get(t, [])
        lines.append(f"## {t}")
        if not th:
            lines.append("_No references found._")
            lines.append("")
            continue
        lines.append(f"**{len(th)} references**")
        lines.append("")
        lines.append("| op | file | line | feature | snippet |")
        lines.append("|---|---|---:|---|---|")
        for h in sorted(th, key=lambda x: (x["op"], x["file"], x["line"])):
            snip = (h["snippet"] or "").replace("|", "\\|")[:120]
            lines.append(f"| {h['op']} | `{h['file']}` | {h['line']} | {h['feature']} | `{snip}` |")
        lines.append("")
    return "\n".join(lines)


# ─── Combined report ────────────────────────────────────────────────────────

def generate_report(schema_json: Path, usage_json: Path) -> Path:
    _ensure_audit_dir()
    stamp = _now_stamp()
    out_md = AUDIT_DIR / f"traceability_report_{stamp}.md"

    schema_data = json.loads(schema_json.read_text(encoding="utf-8"))
    usage_data = json.loads(usage_json.read_text(encoding="utf-8"))

    all_tables = sorted(set(schema_data["tables"].keys()) | set(usage_data["tables"]))

    hits_by_table: Dict[str, List[Dict]] = defaultdict(list)
    for h in usage_data.get("hits", []):
        hits_by_table[h["table"]].append(h)

    lines: List[str] = []
    lines.append("# Traceability Report")
    lines.append(f"- Generated: `{stamp}`")
    lines.append(f"- Schema: `{schema_json.name}`")
    lines.append(f"- Usage: `{usage_json.name}`")
    lines.append("")
    lines.append("## Summary")
    lines.append("| table | cols | rows | code refs | ops | verdict |")
    lines.append("|---|---:|---:|---:|---|---|")
    for t in all_tables:
        tinfo = schema_data["tables"].get(t, {})
        cols = len(tinfo.get("columns", []))
        rows = tinfo.get("row_count", "?")
        refs = hits_by_table.get(t, [])
        ops = sorted({r["op"] for r in refs})
        lines.append(f"| `{t}` | {cols} | {rows} | {len(refs)} | {', '.join(ops) or '-'} | UNREVIEWED |")
    lines.append("")
    for t in all_tables:
        tinfo = schema_data["tables"].get(t, {})
        refs = hits_by_table.get(t, [])
        lines.append(f"## {t}")
        lines.append(f"- Rows: **{tinfo.get('row_count', '?')}** | Columns: **{len(tinfo.get('columns', []))}** | Code refs: **{len(refs)}**")
        lines.append("")
        cols = tinfo.get("columns", [])
        if cols:
            lines.append("### Schema")
            lines.append("| # | column | type | format | nullable | default |")
            lines.append("|---:|---|---|---|---|---|")
            for c in cols:
                default = str(c.get("column_default") or "")[:60]
                nullable = "YES" if c.get("is_nullable") else "NO"
                lines.append(
                    f"| {c['ordinal_position']} | `{c['column_name']}` | `{c['data_type']}` | `{c.get('format','')}` | {nullable} | `{default}` |"
                )
            lines.append("")
        if refs:
            lines.append("### Code references")
            lines.append(f"**{len(refs)} references**")
            lines.append("")
            lines.append("| op | file | line | feature | snippet |")
            lines.append("|---|---|---:|---|---|")
            for r in sorted(refs, key=lambda x: (x["op"], x["file"], x["line"])):
                snip = (r.get("snippet") or "").replace("|", "\\|")[:120]
                lines.append(f"| {r['op']} | `{r['file']}` | {r.get('line',0)} | {r.get('feature','')} | `{snip}` |")
            lines.append("")
        else:
            lines.append("### Code references")
            lines.append("_No code references found._")
            lines.append("")
        lines.append("### Verdict")
        lines.append("- **UNREVIEWED**")
        lines.append("")

    out_md.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote: {out_md}")
    return out_md


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main(argv: Optional[Sequence[str]] = None) -> int:
    p = argparse.ArgumentParser(prog="db_audit_toolkit")
    sub = p.add_subparsers(dest="cmd", required=True)

    ps = sub.add_parser("schema", help="Snapshot live DB schema via Supabase REST API")
    ps.add_argument("--all", action="store_true")
    ps.add_argument("--tables", help="Comma-separated table list")

    pt = sub.add_parser("trace", help="Trace code references for tables")
    pt.add_argument("--root", default=".")
    pt.add_argument("--tables", help="Comma-separated table list")
    pt.add_argument("--from-schema-json", help="Use tables from a schema snapshot JSON")

    pr = sub.add_parser("report", help="Generate combined traceability report")
    pr.add_argument("--schema-json", required=True)
    pr.add_argument("--usage-json", required=True)

    args = p.parse_args(argv)

    if args.cmd == "schema":
        schema_snapshot(args.all, getattr(args, "tables", None))
        return 0

    if args.cmd == "trace":
        root = Path(args.root).resolve()
        if args.from_schema_json:
            data = json.loads(Path(args.from_schema_json).read_text(encoding="utf-8"))
            tables = sorted(data["tables"].keys())
        elif args.tables:
            tables = [t.strip() for t in args.tables.split(",") if t.strip()]
        else:
            raise SystemExit("Provide --tables or --from-schema-json")
        trace_tables(root, tables)
        return 0

    if args.cmd == "report":
        generate_report(Path(args.schema_json), Path(args.usage_json))
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
