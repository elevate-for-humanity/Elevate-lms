#!/usr/bin/env python3
"""
scripts/verify-schema.py

Authoritative schema verification against live Supabase DB.

Uses SECURITY DEFINER functions (get_table_columns, get_table_indexes,
get_table_policies, get_view_def) that query pg_catalog directly and
return jsonb — bypasses PostgREST schema cache entirely.

These functions are created/replaced on every run.

Usage:
  SUPABASE_URL=https://xxx.supabase.co \\
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \\
  python3 scripts/verify-schema.py

Exit 0 = all checks passed.
Exit 1 = one or more checks failed.
"""

import json, os, sys, urllib.request, urllib.error

PROJECT_URL  = os.environ.get("SUPABASE_URL", "https://cuxzzpsyufcewtmicszk.supabase.co")
SERVICE_ROLE = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SERVICE_ROLE:
    try:
        for line in open(".env.local"):
            k, _, v = line.strip().partition("=")
            if k == "SUPABASE_SERVICE_ROLE_KEY":
                SERVICE_ROLE = v
                break
    except FileNotFoundError:
        pass

if not SERVICE_ROLE:
    print("SUPABASE_SERVICE_ROLE_KEY not set")
    sys.exit(1)


def rpc_void(sql):
    url  = f"{PROJECT_URL}/rest/v1/rpc/exec_sql"
    body = json.dumps({"sql": sql}).encode()
    req  = urllib.request.Request(url, data=body, headers={
        "apikey": SERVICE_ROLE, "Authorization": f"Bearer {SERVICE_ROLE}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30):
            return True
    except urllib.error.HTTPError:
        return False


def rpc_json(fn, args):
    url  = f"{PROJECT_URL}/rest/v1/rpc/{fn}"
    body = json.dumps(args).encode()
    req  = urllib.request.Request(url, data=body, headers={
        "apikey": SERVICE_ROLE, "Authorization": f"Bearer {SERVICE_ROLE}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            try:
                parsed = json.loads(raw)
                # PostgREST may double-encode jsonb as a JSON string
                if isinstance(parsed, str):
                    try:
                        parsed = json.loads(parsed)
                    except Exception:
                        pass  # leave as string (e.g. get_view_def returns text)
                return parsed
            except json.JSONDecodeError:
                return raw  # plain text response (e.g. get_view_def)
    except urllib.error.HTTPError as e:
        return {"_error": e.read().decode()[:300]}
    except Exception as ex:
        return {"_error": str(ex)}


def bootstrap():
    rpc_void("""
CREATE OR REPLACE FUNCTION get_table_columns(p_tables text[])
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT jsonb_agg(jsonb_build_object(
    'table_name', table_name, 'column_name', column_name,
    'data_type', data_type, 'is_nullable', is_nullable
  ) ORDER BY table_name, ordinal_position)
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = ANY(p_tables);
$$""")
    rpc_void("""
CREATE OR REPLACE FUNCTION get_table_indexes(p_tables text[])
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT jsonb_agg(jsonb_build_object(
    'tablename', tablename, 'indexname', indexname
  ) ORDER BY tablename, indexname)
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = ANY(p_tables);
$$""")
    rpc_void("""
CREATE OR REPLACE FUNCTION get_table_policies(p_tables text[])
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT jsonb_agg(jsonb_build_object(
    'tablename', tablename, 'policyname', policyname, 'cmd', cmd
  ) ORDER BY tablename, policyname)
  FROM pg_policies
  WHERE tablename = ANY(p_tables);
$$""")
    rpc_void("""
CREATE OR REPLACE FUNCTION get_view_def(p_view text)
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT definition FROM pg_views
  WHERE schemaname = 'public' AND viewname = p_view;
$$""")


EXPECTED_COLUMNS = {
    "curriculum_lesson_plans": [
        "id","program_id","lesson_slug","lesson_title","learning_objective",
        "cognitive_level","primary_competency_key","supporting_competency_keys",
        "key_concepts","required_distinctions","avoided_misconceptions",
        "exam_domain","exam_subdomain","estimated_minutes","created_at","updated_at",
    ],
    "curriculum_lessons": [
        "id","program_id","course_id","lesson_slug","lesson_title",
        "lesson_order","module_order","module_title","script_text","key_terms",
        "duration_minutes","status","created_at","updated_at",
        "competency_keys","lesson_plan_id",
        "summary_text","reflection_prompt",
    ],
    "competency_exam_profiles": [
        "id","competency_key","competency_name","program_slug","must_assess",
        "exam_domain","exam_subdomain","required_phrases","requires_distinction",
        "distinction_side_a","distinction_side_b","distinction_label",
        "distractor_phrases","distractor_explanation","cognitive_operation",
        "response_depth","created_at","updated_at",
    ],
    "lms_lessons": [
        "id","course_id","title","content","lesson_source",
        "order_index","is_published","is_required","content_type","duration_minutes",
    ],
}

EXPECTED_INDEXES = {
    "curriculum_lesson_plans": [
        "idx_lesson_plans_program_id",
        "idx_lesson_plans_primary_competency",
    ],
    "curriculum_lessons": [
        "idx_curriculum_lessons_competency_keys",
        "idx_curriculum_lessons_lesson_plan_id",
    ],
    "competency_exam_profiles": [
        "idx_exam_profiles_program_slug",
        "idx_exam_profiles_must_assess",
    ],
}

EXPECTED_POLICIES = {
    "curriculum_lesson_plans":  ["authenticated read lesson plans"],
    "competency_exam_profiles": ["authenticated read exam profiles"],
    "curriculum_lessons":       ["authenticated_read","service_role_all"],
}

bootstrap()

failures = []

def check(label, passed, detail=""):
    if passed:
        print(f"  ✅ {label}")
    else:
        print(f"  ❌ {label}" + (f": {detail}" if detail else ""))
        failures.append(label)


print("\n── 1. COLUMNS ──────────────────────────────────────────────────────────")
col_data = rpc_json("get_table_columns", {"p_tables": list(EXPECTED_COLUMNS.keys())})
if isinstance(col_data, dict) and "_error" in col_data:
    check("get_table_columns RPC", False, col_data["_error"])
else:
    live_cols: dict = {}
    for row in (col_data or []):
        live_cols.setdefault(row["table_name"], set()).add(row["column_name"])
    for table, expected in EXPECTED_COLUMNS.items():
        missing = [c for c in expected if c not in live_cols.get(table, set())]
        check(f"{table} — {len(expected)} columns",
              not missing, f"missing: {missing}" if missing else "")


print("\n── 2. INDEXES ──────────────────────────────────────────────────────────")
idx_data = rpc_json("get_table_indexes", {"p_tables": list(EXPECTED_INDEXES.keys())})
if isinstance(idx_data, dict) and "_error" in idx_data:
    check("get_table_indexes RPC", False, idx_data["_error"])
else:
    live_idx: dict = {}
    for row in (idx_data or []):
        live_idx.setdefault(row["tablename"], set()).add(row["indexname"])
    for table, expected in EXPECTED_INDEXES.items():
        missing = [i for i in expected if i not in live_idx.get(table, set())]
        check(f"{table} — {len(expected)} indexes",
              not missing, f"missing: {missing}" if missing else "")


print("\n── 3. RLS POLICIES ─────────────────────────────────────────────────────")
pol_data = rpc_json("get_table_policies", {"p_tables": list(EXPECTED_POLICIES.keys())})
if isinstance(pol_data, dict) and "_error" in pol_data:
    check("get_table_policies RPC", False, pol_data["_error"])
else:
    live_pol: dict = {}
    for row in (pol_data or []):
        live_pol.setdefault(row["tablename"], set()).add(row["policyname"])
    for table, expected in EXPECTED_POLICIES.items():
        missing = [p for p in expected if p not in live_pol.get(table, set())]
        check(f"{table} — {len(expected)} policies",
              not missing, f"missing: {missing}" if missing else "")


print("\n── 4. LMS_LESSONS VIEW ─────────────────────────────────────────────────")
view_def = rpc_json("get_view_def", {"p_view": "lms_lessons"})
if isinstance(view_def, dict) and "_error" in view_def:
    check("lms_lessons view exists", False, view_def["_error"])
elif not view_def:
    check("lms_lessons view exists", False, "not found in pg_views")
else:
    check("lms_lessons view exists", True)
    check("lms_lessons has lesson_source column", "lesson_source" in view_def)
    check("lms_lessons unions curriculum and training",
          "curriculum" in view_def and "training" in view_def)


total  = len(EXPECTED_COLUMNS) + len(EXPECTED_INDEXES) + len(EXPECTED_POLICIES) + 3
passed = total - len(failures)

print(f"\n── SUMMARY ─────────────────────────────────────────────────────────────")
print(f"  {passed}/{total} checks passed")

if failures:
    print(f"\n❌ {len(failures)} failed: {failures}")
    sys.exit(1)
else:
    print("\n✅ All schema checks passed")
    sys.exit(0)
