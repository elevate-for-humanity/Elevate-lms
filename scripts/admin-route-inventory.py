#!/usr/bin/env python3
"""
Generate machine-readable admin route inventory.
Traverses app/admin/**/page.tsx, classifies each page, captures data deps.
Output: scripts/admin-route-inventory.json
"""
import os, re, json, sys

ADMIN_DIR = "app/admin"
SCHEMA_FILE = "scripts/live-schema-snapshot.json"

# Load live schema
with open(SCHEMA_FILE) as f:
    raw = json.load(f)
live_cols = {}
for row in raw:
    t = row["table_name"]
    if t not in live_cols:
        live_cols[t] = set()
    live_cols[t].add(row["column_name"])

def path_to_route(fpath):
    """app/admin/foo/bar/page.tsx -> /admin/foo/bar"""
    parts = fpath.replace("\\", "/").split("/")
    # Remove 'app' prefix and 'page.tsx' suffix
    route_parts = parts[1:-1]  # skip 'app' and 'page.tsx'
    return "/" + "/".join(route_parts)

def extract_tables_read(content):
    """Extract .from('table').select() patterns."""
    reads = {}
    for m in re.finditer(
        r"\.from\(['\"](\w+)['\"]\)\s*\.select\(['\"`]([^'\"`]*)['\"`]\)",
        content, re.DOTALL
    ):
        table = m.group(1)
        select_str = m.group(2)
        if table not in reads:
            reads[table] = set()
        if select_str.strip() == "*":
            reads[table].add("*")
        else:
            # Remove nested relations
            cleaned = re.sub(r'\w+\s*\([^)]*\)', '', select_str)
            for part in cleaned.split(","):
                col = part.strip().split(":")[0].strip().rstrip(")")
                if col and col != "*" and col != "count":
                    reads[table].add(col)
    # Also catch .from('table').select('*', { count: ... })
    for m in re.finditer(
        r"\.from\(['\"](\w+)['\"]\)\s*\.select\(['\"](\*)['\"]",
        content
    ):
        table = m.group(1)
        if table not in reads:
            reads[table] = set()
        reads[table].add("*")
    # Convert sets to sorted lists
    return {t: sorted(list(c)) for t, c in reads.items()}

def extract_tables_written(content):
    """Extract .from('table').insert/update/delete/upsert patterns."""
    writes = []
    for m in re.finditer(
        r"\.from\(['\"](\w+)['\"]\)\s*\.(insert|update|delete|upsert)\(",
        content
    ):
        writes.append({"table": m.group(1), "op": m.group(2)})
    return writes

def extract_rpcs(content):
    """Extract .rpc('name') calls."""
    rpcs = []
    for m in re.finditer(r"\.rpc\(['\"](\w+)['\"]", content):
        rpcs.append(m.group(1))
    return sorted(set(rpcs))

def extract_api_routes(content):
    """Extract fetch('/api/...') calls."""
    routes = []
    for m in re.finditer(r"fetch\(['\"`](/api/[^'\"`\s]+)", content):
        routes.append(m.group(1))
    return sorted(set(routes))

def extract_server_actions(content):
    """Extract imported server actions."""
    actions = []
    for m in re.finditer(r"import\s*\{([^}]+)\}\s*from\s*['\"]\.*/actions['\"]", content):
        for name in m.group(1).split(","):
            name = name.strip()
            if name:
                actions.append(name)
    # Also form action= references
    for m in re.finditer(r"action=\{(\w+)\}", content):
        actions.append(m.group(1))
    return sorted(set(actions))

def classify_page(content, reads, writes, rpcs, api_routes, actions):
    """Classify page as LIVE/FORM/SHELL/STATIC."""
    has_supabase = bool(reads or writes or rpcs)
    has_api = bool(api_routes)
    has_fetch = "fetch(" in content
    has_form = bool(actions) or "<form" in content or "onSubmit" in content or "handleSubmit" in content
    has_hardcoded_empty = bool(re.search(r'(const \w+ = \[\]|: \w+\[\] = \[\])', content))
    has_useeffect = "useEffect" in content
    has_createclient = "createClient" in content

    # LIVE: has data fetching (direct supabase or API routes)
    if has_supabase or (has_api and has_fetch and (has_useeffect or has_createclient)):
        return "LIVE"
    
    # FORM: has form submission but no read queries
    if has_form and (has_api or actions):
        return "FORM"
    
    # SHELL: has UI structure but only hardcoded data
    if has_hardcoded_empty and not has_supabase and not has_api:
        return "SHELL"
    
    # FORM: has form elements
    if has_form:
        return "FORM"
    
    # If it fetches from API routes
    if has_api and has_fetch:
        return "LIVE"
    
    # STATIC: everything else
    return "STATIC"

def check_columns(reads, table_cols_map):
    """Check if selected columns exist in live schema. Returns mismatches."""
    mismatches = []
    for table, cols in reads.items():
        if table not in table_cols_map:
            mismatches.append({"table": table, "column": "*", "issue": "TABLE_MISSING"})
            continue
        live = table_cols_map[table]
        for col in cols:
            if col == "*":
                continue
            if col not in live:
                mismatches.append({"table": table, "column": col, "issue": "COLUMN_MISSING"})
    return mismatches

def extract_filter_columns(content):
    """Extract .eq('col'), .neq('col'), etc. with their table context."""
    filters = []
    # Find chains: .from('table')...eq('col')
    for m in re.finditer(
        r"\.from\(['\"](\w+)['\"]\)((?:\s*\.\w+\([^)]*\))*)",
        content, re.DOTALL
    ):
        table = m.group(1)
        chain = m.group(2)
        for fm in re.finditer(
            r"\.(eq|neq|gt|lt|gte|lte|ilike|like|is|in|contains|match)\(['\"](\w+)['\"]",
            chain
        ):
            filters.append({"table": table, "column": fm.group(2), "op": fm.group(1)})
    return filters

def check_filters(filters, table_cols_map):
    """Check if filter columns exist."""
    mismatches = []
    seen = set()
    for f in filters:
        key = (f["table"], f["column"])
        if key in seen:
            continue
        seen.add(key)
        if f["table"] not in table_cols_map:
            continue
        if f["column"] not in table_cols_map[f["table"]]:
            mismatches.append({
                "table": f["table"],
                "column": f["column"],
                "issue": f"FILTER_COLUMN_MISSING (via .{f['op']})"
            })
    return mismatches

def detect_audit_events(content, writes):
    """Check if mutations have corresponding audit event inserts."""
    has_audit_insert = bool(re.search(
        r"\.from\(['\"](?:admin_audit_events|audit_logs)['\"].*\.insert",
        content, re.DOTALL
    ))
    has_audit_api = bool(re.search(r"fetch\(['\"`]/api/.*audit", content))
    has_audit_rpc = bool(re.search(r"\.rpc\(['\"].*audit", content))
    has_audit_helper = bool(re.search(r"writeAdminAuditEvent|logAuditEvent|auditEnrollment|AuditActions", content))
    has_audit_import = bool(re.search(r"import.*(?:audit|Audit)", content))
    
    return has_audit_insert or has_audit_api or has_audit_rpc or has_audit_helper or has_audit_import

# Main inventory generation
inventory = []

for root, dirs, files in os.walk(ADMIN_DIR):
    for fname in files:
        if fname != "page.tsx":
            continue
        fpath = os.path.join(root, fname)
        route = path_to_route(fpath)
        
        with open(fpath) as f:
            content = f.read()
        
        # Also read co-located files (actions.ts, client components)
        colocated_content = content
        dir_path = os.path.dirname(fpath)
        for cf in os.listdir(dir_path):
            if cf.endswith((".ts", ".tsx")) and cf != "page.tsx":
                with open(os.path.join(dir_path, cf)) as f:
                    colocated_content += "\n" + f.read()
        
        reads = extract_tables_read(colocated_content)
        writes = extract_tables_written(colocated_content)
        rpcs = extract_rpcs(colocated_content)
        api_routes = extract_api_routes(colocated_content)
        actions = extract_server_actions(colocated_content)
        filters = extract_filter_columns(colocated_content)
        
        classification = classify_page(colocated_content, reads, writes, rpcs, api_routes, actions)
        
        # Column checks
        select_mismatches = check_columns(reads, live_cols)
        filter_mismatches = check_filters(filters, live_cols)
        all_mismatches = select_mismatches + filter_mismatches
        
        # Audit check
        has_mutations = bool(writes)
        has_audit = detect_audit_events(colocated_content, writes)
        
        # Determine purpose from metadata or h1
        purpose = ""
        meta_match = re.search(r"title:\s*['\"]([^'\"]+)['\"]", content)
        if meta_match:
            purpose = meta_match.group(1)
        if not purpose:
            h1_match = re.search(r"<h1[^>]*>([^<]+)</h1>", content)
            if h1_match:
                purpose = h1_match.group(1).strip()
        
        lines = len(content.split("\n"))
        
        entry = {
            "route": route,
            "file": fpath,
            "lines": lines,
            "status": classification,
            "purpose": purpose,
            "reads": reads,
            "writes": [{"table": w["table"], "op": w["op"]} for w in writes],
            "rpcs": rpcs,
            "api_routes": api_routes,
            "server_actions": actions,
            "column_mismatches": all_mismatches,
            "has_mutations": has_mutations,
            "has_audit_trail": has_audit,
            "audit_gap": has_mutations and not has_audit,
        }
        
        inventory.append(entry)

# Sort by route
inventory.sort(key=lambda x: x["route"])

# Write JSON
with open("scripts/admin-route-inventory.json", "w") as f:
    json.dump(inventory, f, indent=2, default=list)

# Print summary
total = len(inventory)
by_status = {}
for e in inventory:
    by_status[e["status"]] = by_status.get(e["status"], 0) + 1

col_fail = sum(1 for e in inventory if e["column_mismatches"])
audit_gap = sum(1 for e in inventory if e["audit_gap"])
mutation_pages = sum(1 for e in inventory if e["has_mutations"])

print(f"Admin Route Inventory: {total} pages")
print(f"  LIVE:   {by_status.get('LIVE', 0)}")
print(f"  FORM:   {by_status.get('FORM', 0)}")
print(f"  SHELL:  {by_status.get('SHELL', 0)}")
print(f"  STATIC: {by_status.get('STATIC', 0)}")
print(f"\nColumn mismatches: {col_fail} pages affected")
print(f"Mutation pages: {mutation_pages}")
print(f"Audit gaps (mutation without audit trail): {audit_gap}")

# Print column mismatch details
if col_fail:
    print("\n--- Column Mismatches ---")
    for e in inventory:
        if e["column_mismatches"]:
            for mm in e["column_mismatches"]:
                print(f"  {e['route']}: {mm['table']}.{mm['column']} — {mm['issue']}")

# Print audit gaps
if audit_gap:
    print("\n--- Audit Gaps (mutations without audit trail) ---")
    for e in inventory:
        if e["audit_gap"]:
            tables = ", ".join(f"{w['table']}.{w['op']}" for w in e["writes"])
            print(f"  {e['route']}: {tables}")
