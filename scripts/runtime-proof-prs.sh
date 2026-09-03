#!/usr/bin/env bash
set -euo pipefail

PROGRAM_SLUG="${1:-peer-recovery-specialist-jri}"
CREDENTIAL_CODE="${2:-IN-PRS}"
ROOT="${3:-.}"

cd "$ROOT"

pass() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }
fail() { echo "❌ $1"; }
info() { echo "• $1"; }

section() {
  echo
  echo "=================================================================="
  echo "$1"
  echo "=================================================================="
}

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    fail "Missing required env var: $name"
    exit 1
  fi
}

require_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    fail "Required command not found: $name"
    exit 1
  fi
}

section "PRS RUNTIME PROOF"

info "Program slug: $PROGRAM_SLUG"
info "Credential code: $CREDENTIAL_CODE"

require_cmd curl
require_cmd python3

# Expected:
#   SUPABASE_PROJECT_REF=cuxzzpsyufcewtmicszk
#   SUPABASE_MGMT_KEY=sbp_xxx
require_env SUPABASE_PROJECT_REF
require_env SUPABASE_MGMT_KEY

DB_URL="https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query"
AUTH_HEADER="Authorization: Bearer $SUPABASE_MGMT_KEY"
JSON_HEADER="Content-Type: application/json"

run_sql() {
  local sql="$1"
  curl -sS -X POST "$DB_URL" \
    -H "$AUTH_HEADER" \
    -H "$JSON_HEADER" \
    -d "$(python3 - <<PY
import json
sql = """$sql"""
print(json.dumps({"query": sql}))
PY
)"
}

print_table() {
  python3 - <<'PY'
import json, sys
raw = sys.stdin.read().strip()
if not raw:
    print("(no output)")
    sys.exit(0)

try:
    data = json.loads(raw)
except Exception:
    print(raw)
    sys.exit(0)

if isinstance(data, dict) and data.get("error"):
    print(json.dumps(data, indent=2))
    sys.exit(0)

if not isinstance(data, list):
    print(json.dumps(data, indent=2))
    sys.exit(0)

if len(data) == 0:
    print("(0 rows)")
    sys.exit(0)

cols = sorted({k for row in data if isinstance(row, dict) for k in row.keys()})
widths = {c: max(len(c), *(len(str(row.get(c, ""))) for row in data)) for c in cols}

print(" | ".join(c.ljust(widths[c]) for c in cols))
print("-+-".join("-" * widths[c] for c in cols))
for row in data:
    print(" | ".join(str(row.get(c, "")).ljust(widths[c]) for c in cols))
PY
}

get_scalar() {
  local sql="$1"
  run_sql "$sql" | python3 - <<'PY'
import json, sys
raw = sys.stdin.read().strip()
data = json.loads(raw)
if not data:
    print("")
elif isinstance(data, list):
    row = data[0] if data else {}
    if isinstance(row, dict):
        print(next(iter(row.values()), ""))
    else:
        print(row)
else:
    print("")
PY
}

section "1) PROGRAM / COURSE / BLUEPRINT DISCOVERY"

PROGRAM_SQL="
select
  p.id as program_id,
  p.slug as program_slug,
  p.title as program_title,
  c.id as course_id,
  c.slug as course_slug,
  c.title as course_title
from programs p
left join courses c on c.program_id = p.id
where p.slug = '$PROGRAM_SLUG'
order by c.created_at nulls last, c.title;
"

PROGRAM_JSON="$(run_sql "$PROGRAM_SQL")"
echo "$PROGRAM_JSON" | print_table

PROGRAM_ID="$(echo "$PROGRAM_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["program_id"] if data else "")
PY
)"

COURSE_ID="$(echo "$PROGRAM_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["course_id"] if data else "")
PY
)"

if [ -n "$PROGRAM_ID" ]; then
  pass "Program found: $PROGRAM_ID"
else
  fail "Program not found for slug: $PROGRAM_SLUG"
fi

if [ -n "$COURSE_ID" ]; then
  pass "Course found: $COURSE_ID"
else
  warn "No course found for program slug: $PROGRAM_SLUG"
fi

BLUEPRINT_SQL="
select
  cb.id as blueprint_id,
  cb.credential_code,
  cb.blueprint_code,
  count(distinct d.id) as domain_count,
  count(distinct c.id) as competency_count
from credential_blueprints cb
left join credential_blueprint_domains d on d.blueprint_id = cb.id
left join credential_blueprint_competencies c on c.domain_id = d.id
where cb.credential_code = '$CREDENTIAL_CODE'
group by cb.id, cb.credential_code, cb.blueprint_code;
"

BLUEPRINT_JSON="$(run_sql "$BLUEPRINT_SQL")"
echo "$BLUEPRINT_JSON" | print_table

BLUEPRINT_ID="$(echo "$BLUEPRINT_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["blueprint_id"] if data else "")
PY
)"

EXPECTED_COMPETENCIES="$(echo "$BLUEPRINT_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["competency_count"] if data else "0")
PY
)"

if [ -n "$BLUEPRINT_ID" ]; then
  pass "Blueprint found: $BLUEPRINT_ID"
else
  fail "Blueprint not found for credential code: $CREDENTIAL_CODE"
fi

section "2) PUBLISHED CURRICULUM ROWS"

if [ -z "$PROGRAM_ID" ]; then
  fail "Cannot test curriculum rows without program_id"
  exit 1
fi

CURRICULUM_COUNT_SQL="
select
  count(*) as curriculum_rows,
  count(*) filter (where status = 'published') as published_rows,
  count(*) filter (where coalesce(summary_text, '') <> '') as with_summary_text,
  count(*) filter (where coalesce(reflection_prompt, '') <> '') as with_reflection_prompt,
  count(*) filter (where array_length(coalesce(competency_keys, '{}'), 1) >= 1) as with_competency_keys,
  count(*) filter (where coalesce(script_text, '') <> '') as with_script_text,
  count(*) filter (where coalesce(key_terms::text, '') <> '' and key_terms::text <> '[]') as with_key_terms
from curriculum_lessons
where program_id = '$PROGRAM_ID';
"

CURRICULUM_COUNT_JSON="$(run_sql "$CURRICULUM_COUNT_SQL")"
echo "$CURRICULUM_COUNT_JSON" | print_table

CURRICULUM_ROWS="$(echo "$CURRICULUM_COUNT_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["curriculum_rows"] if data else "0")
PY
)"

WITH_SUMMARY="$(echo "$CURRICULUM_COUNT_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["with_summary_text"] if data else "0")
PY
)"

WITH_REFLECTION="$(echo "$CURRICULUM_COUNT_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["with_reflection_prompt"] if data else "0")
PY
)"

WITH_COMP_KEYS="$(echo "$CURRICULUM_COUNT_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["with_competency_keys"] if data else "0")
PY
)"

if [ "${CURRICULUM_ROWS:-0}" -ge 35 ]; then
  pass "Curriculum lesson volume looks plausible ($CURRICULUM_ROWS rows)"
elif [ "${CURRICULUM_ROWS:-0}" -gt 0 ]; then
  warn "Curriculum rows exist but volume is low ($CURRICULUM_ROWS rows)"
else
  fail "No curriculum_lessons rows found for program"
fi

if [ "${WITH_SUMMARY:-0}" -eq "${CURRICULUM_ROWS:-0}" ] && [ "${CURRICULUM_ROWS:-0}" -gt 0 ]; then
  pass "All curriculum rows have summary_text"
else
  warn "Some curriculum rows are missing summary_text"
fi

if [ "${WITH_REFLECTION:-0}" -eq "${CURRICULUM_ROWS:-0}" ] && [ "${CURRICULUM_ROWS:-0}" -gt 0 ]; then
  pass "All curriculum rows have reflection_prompt"
else
  warn "Some curriculum rows are missing reflection_prompt"
fi

if [ "${WITH_COMP_KEYS:-0}" -eq "${CURRICULUM_ROWS:-0}" ] && [ "${CURRICULUM_ROWS:-0}" -gt 0 ]; then
  pass "All curriculum rows have competency_keys"
else
  warn "competency_keys is not fully populated — traceability is incomplete"
fi

section "3) SAMPLE PUBLISHED LESSONS"

SAMPLE_LESSONS_SQL="
select
  id,
  lesson_slug,
  lesson_title as title,
  status,
  module_order,
  lesson_order,
  cardinality(coalesce(competency_keys, '{}')) as competency_key_count,
  left(coalesce(summary_text, ''), 80) as summary_preview
from curriculum_lessons
where program_id = '$PROGRAM_ID'
order by module_order nulls last, lesson_order nulls last, created_at
limit 15;
"

run_sql "$SAMPLE_LESSONS_SQL" | print_table

section "4) COMPETENCY COVERAGE AGAINST BLUEPRINT"

if [ -n "$BLUEPRINT_ID" ]; then
  COVERAGE_SQL="
  with expected as (
    select c.competency_key
    from credential_blueprint_competencies c
    join credential_blueprint_domains d on d.id = c.domain_id
    where d.blueprint_id = '$BLUEPRINT_ID'
  ),
  covered as (
    select distinct unnest(coalesce(cl.competency_keys, '{}')) as competency_key
    from curriculum_lessons cl
    where cl.program_id = '$PROGRAM_ID'
  )
  select
    count(*) as expected_competencies,
    count(*) filter (where covered.competency_key is not null) as covered_competencies,
    count(*) filter (where covered.competency_key is null) as missing_competencies
  from expected
  left join covered on covered.competency_key = expected.competency_key;
  "
  COVERAGE_JSON="$(run_sql "$COVERAGE_SQL")"
  echo "$COVERAGE_JSON" | print_table

  COVERED_COMP="$(echo "$COVERAGE_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["covered_competencies"] if data else "0")
PY
)"
  MISSING_COMP="$(echo "$COVERAGE_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["missing_competencies"] if data else "0")
PY
)"

  if [ "${MISSING_COMP:-0}" -eq 0 ] && [ "${EXPECTED_COMPETENCIES:-0}" -gt 0 ]; then
    pass "All blueprint competencies are covered by published curriculum rows"
  else
    warn "Blueprint competency coverage is incomplete"
  fi

  echo
  info "Missing competency keys:"
  MISSING_KEYS_SQL="
  with expected as (
    select c.competency_key
    from credential_blueprint_competencies c
    join credential_blueprint_domains d on d.id = c.domain_id
    where d.blueprint_id = '$BLUEPRINT_ID'
  ),
  covered as (
    select distinct unnest(coalesce(cl.competency_keys, '{}')) as competency_key
    from curriculum_lessons cl
    where cl.program_id = '$PROGRAM_ID'
  )
  select expected.competency_key
  from expected
  left join covered on covered.competency_key = expected.competency_key
  where covered.competency_key is null
  order by expected.competency_key;
  "
  run_sql "$MISSING_KEYS_SQL" | print_table
fi

section "5) LMS VIEW PROOF"

if [ -n "$COURSE_ID" ]; then
  LMS_VIEW_SQL="
  select
    count(*) as lms_rows,
    count(*) filter (where lesson_source = 'curriculum') as curriculum_source_rows,
    count(*) filter (where lesson_source = 'training') as training_source_rows
  from lms_lessons
  where course_id = '$COURSE_ID';
  "
  LMS_VIEW_JSON="$(run_sql "$LMS_VIEW_SQL")"
  echo "$LMS_VIEW_JSON" | print_table

  CURRIC_SOURCE_ROWS="$(echo "$LMS_VIEW_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["curriculum_source_rows"] if data else "0")
PY
)"
  TRAINING_SOURCE_ROWS="$(echo "$LMS_VIEW_JSON" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print(data[0]["training_source_rows"] if data else "0")
PY
)"

  if [ "${CURRIC_SOURCE_ROWS:-0}" -gt 0 ]; then
    pass "lms_lessons is serving curriculum rows for this course"
  else
    fail "lms_lessons is not serving curriculum rows for this course"
  fi

  if [ "${TRAINING_SOURCE_ROWS:-0}" -eq 0 ]; then
    pass "No fallback training rows are being served through lms_lessons"
  else
    warn "Fallback training rows are still present in lms_lessons"
  fi

  echo
  info "Sample learner-facing rows from lms_lessons:"
  LMS_SAMPLE_SQL="
  select
    id,
    lesson_source,
    title,
    lesson_slug as idx,
    module_order,
    order_index
  from lms_lessons
  where course_id = '$COURSE_ID'
  order by module_order nulls last, order_index nulls last
  limit 15;
  "
  run_sql "$LMS_SAMPLE_SQL" | print_table
else
  warn "Skipping lms_lessons proof because course_id was not found"
fi

section "6) AUDIT / VALIDATION SIGNALS"

AUDIT_TABLE_CHECK_SQL="
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'curriculum_validation_results',
    'curriculum_generation_runs',
    'curriculum_generation_lessons'
  )
order by table_name;
"

AUDIT_TABLES_JSON="$(run_sql "$AUDIT_TABLE_CHECK_SQL")"
echo "$AUDIT_TABLES_JSON" | print_table

echo
info "Validation result summary (if table exists):"
VALIDATION_SUMMARY_SQL="
select
  count(*) as total_results,
  count(*) filter (where passed = true) as passed_results,
  count(*) filter (where passed = false) as failed_results,
  round(avg(score)::numeric, 2) as avg_score
from curriculum_validation_results
where program_id = '$PROGRAM_ID';
"
run_sql "$VALIDATION_SUMMARY_SQL" | print_table || true

section "7) LEARNER FLOW READINESS"

LESSON_PROGRESS_EXISTS_SQL="
select exists (
  select 1
  from information_schema.tables
  where table_schema = 'public'
    and table_name = 'lesson_progress'
) as lesson_progress_exists;
"

LESSON_PROGRESS_JSON="$(run_sql "$LESSON_PROGRESS_EXISTS_SQL")"
echo "$LESSON_PROGRESS_JSON" | print_table

ROUTE_CHECKS=(
  "app/api/lessons/[lessonId]/complete/route.ts|completion route exists"
  "app/lms/(app)/courses/[courseId]/page.tsx|course page exists"
  "app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx|lesson page exists"
  "app/lms/(app)/program/[programId]/page.tsx|program page exists"
)

for entry in "${ROUTE_CHECKS[@]}"; do
  path="${entry%%|*}"
  label="${entry##*|}"
  if [ -f "$path" ]; then
    pass "$label"
  else
    warn "$label missing: $path"
  fi
done

ROUTE="app/api/lessons/[lessonId]/complete/route.ts"
if [ -f "$ROUTE" ]; then
  if grep -q "checkEligibilityAndAuthorize" "$ROUTE"; then
    pass "Completion route contains checkEligibilityAndAuthorize"
  else
    warn "Completion route does not contain checkEligibilityAndAuthorize"
  fi

  if grep -q "lms_lessons" "$ROUTE"; then
    pass "Completion route reads from lms_lessons"
  else
    warn "Completion route does not clearly read from lms_lessons"
  fi

  if grep -q "lesson_progress" "$ROUTE"; then
    pass "Completion route references lesson_progress"
  else
    warn "Completion route does not clearly reference lesson_progress"
  fi
fi

section "8) FINAL SCORECARD"

score=0
max=7

[ -n "$PROGRAM_ID" ] && score=$((score+1))
[ -n "$BLUEPRINT_ID" ] && score=$((score+1))
[ "${CURRICULUM_ROWS:-0}" -ge 35 ] && score=$((score+1)) || true
[ "${WITH_SUMMARY:-0}" -eq "${CURRICULUM_ROWS:-0}" ] && [ "${CURRICULUM_ROWS:-0}" -gt 0 ] && score=$((score+1)) || true
[ "${WITH_REFLECTION:-0}" -eq "${CURRICULUM_ROWS:-0}" ] && [ "${CURRICULUM_ROWS:-0}" -gt 0 ] && score=$((score+1)) || true
[ "${WITH_COMP_KEYS:-0}" -eq "${CURRICULUM_ROWS:-0}" ] && [ "${CURRICULUM_ROWS:-0}" -gt 0 ] && score=$((score+1)) || true
[ "${CURRIC_SOURCE_ROWS:-0}" -gt 0 ] && score=$((score+1)) || true

echo
echo "Runtime proof score: $score / $max"

if [ "$score" -eq 7 ]; then
  pass "PRS runtime proof is strong"
elif [ "$score" -ge 5 ]; then
  warn "PRS runtime proof is partial — close, but not clean"
else
  fail "PRS runtime proof failed — generator/publish/serve path is not proven"
fi

section "9) BOTTOM LINE"

cat <<EOF
You are only actually done if all of this is true:

1. Program and blueprint both exist
2. Published curriculum rows exist at real volume
3. summary_text is populated
4. reflection_prompt is populated
5. competency_keys is populated
6. lms_lessons serves curriculum rows, not fallback training rows
7. completion route writes progress and triggers eligibility

If competency_keys is still under-populated, your system is not traceable enough.
That is the next thing to fix.
EOF
