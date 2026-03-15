#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

echo "=================================================================="
echo "COURSE GENERATOR READINESS AUDIT"
echo "=================================================================="
echo

pass() { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }
fail() { echo "❌ $1"; }

section() {
  echo
  echo "------------------------------------------------------------------"
  echo "$1"
  echo "------------------------------------------------------------------"
}

check_file() {
  local path="$1"
  local label="$2"
  if [ -f "$path" ]; then
    pass "$label: $path"
  else
    fail "$label missing: $path"
  fi
}

check_dir_has_files() {
  local dir="$1"
  local pattern="$2"
  local label="$3"
  if find "$dir" -type f -name "$pattern" 2>/dev/null | grep -q .; then
    pass "$label found in $dir"
  else
    fail "$label missing in $dir"
  fi
}

grep_check() {
  local pattern="$1"
  local scope="$2"
  local label="$3"
  if grep -RInE "$pattern" $scope >/dev/null 2>&1; then
    pass "$label"
    grep -RInE "$pattern" $scope 2>/dev/null | head -10
  else
    fail "$label"
  fi
}

grep_absent() {
  local pattern="$1"
  local scope="$2"
  local label="$3"
  if grep -RInE "$pattern" $scope >/dev/null 2>&1; then
    warn "$label"
    grep -RInE "$pattern" $scope 2>/dev/null | head -20
  else
    pass "$label"
  fi
}

section "1) CORE CURRICULUM / GENERATOR FILES"

check_file "lib/curriculum/types.ts" "Curriculum types"
check_file "lib/curriculum/validator.ts" "Lesson contract validator"
check_file "lib/curriculum/lesson-contract.schema.json" "Lesson contract schema"
check_file "lib/curriculum/audit-alignment.ts" "Alignment audit"
check_dir_has_files "lib" "*.ts" "TypeScript source files"

echo
echo "Possible generator files:"
find . -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null \
  | grep -Ei "generate|generator|publish|curriculum|lesson" \
  | sed 's#^\./##' \
  | sort \
  | head -200

section "2) REQUIRED PIPELINE CAPABILITIES"

grep_check "scoreCompetencyFidelity" "." "Competency fidelity scoring exists"
grep_check "scoreExamRelevance" "." "Exam relevance scoring exists"
grep_check "scoreInstructionalCompleteness|completeness" "." "Completeness scoring exists"
grep_check "fidelity_gate" "." "Per-competency fidelity gate exists"
grep_check "competency_fidelity" "." "Per-competency fidelity tracking exists"
grep_check "summary_text" "." "Summary field is referenced"
grep_check "reflection_prompt" "." "Reflection prompt field is referenced"
grep_check "competency_codes" "." "Competency codes field is referenced"

section "3) COMMON LEGACY LEAKS / WRONG TABLE REFERENCES"

grep_absent "from\(['\"]training_lessons['\"]\)" "app lib" "No lingering training_lessons reads in app/lib"
grep_absent "course_progress" "app lib supabase" "No lingering course_progress references"
grep_check "from\(['\"]lms_lessons['\"]\)|from\(['\"]curriculum_lessons['\"]\)" "app lib" "LMS or curriculum lesson reads exist"

section "4) LMS ROUTES THAT MUST BE WIRED"

check_file "app/api/lessons/[lessonId]/complete/route.ts" "Lesson completion route"
grep_check "checkEligibilityAndAuthorize" "app/api/lessons/[lessonId]/complete/route.ts lib" "Eligibility authorization hook is wired"
grep_check "lesson_progress" "app/api/lessons/[lessonId]/complete/route.ts app lib" "Lesson completion writes/read path uses lesson_progress"

echo
echo "Likely learner-facing lesson routes:"
find app -type f \( -name "page.tsx" -o -name "route.ts" \) 2>/dev/null \
  | grep -Ei "lesson|course|program|lms" \
  | sed 's#^\./##' \
  | sort \
  | head -200

section "5) PUBLISH PIPELINE"

grep_check "publish-generated-lessons|publish.*lesson" "." "Publish script or publish logic exists"
grep_check "summary_text" "." "Publish path includes summary_text"
grep_check "reflection_prompt" "." "Publish path includes reflection_prompt"
grep_check "competency_codes" "." "Publish path includes competency_codes"
grep_check "voiceover_script|script_text" "." "Voiceover/script field mapping exists"
grep_check "glossary_json|key_terms" "." "Glossary/key_terms field mapping exists"

section "6) BLUEPRINT / COMPETENCY TRACEABILITY"

grep_check "credential_blueprint" "lib app supabase" "Blueprint tables referenced"
grep_check "credential_blueprint_competencies|curriculum_lesson_competencies" "lib app supabase" "Competency traceability tables referenced"
grep_check "practice_exam_blueprints|question_bank" "lib app supabase" "Exam blueprint or question bank references exist"

section "7) DATABASE MIGRATIONS / SCHEMA"

echo "Migration files:"
find supabase/migrations -type f -name "*.sql" 2>/dev/null | sed 's#^\./##' | sort | tail -100 || true

grep_check "curriculum_lessons" "supabase/migrations supabase" "curriculum_lessons appears in migrations"
grep_check "summary_text" "supabase/migrations supabase" "summary_text appears in migrations"
grep_check "reflection_prompt" "supabase/migrations supabase" "reflection_prompt appears in migrations"
grep_check "competency_codes" "supabase/migrations supabase" "competency_codes appears in migrations"

section "8) TYPECHECK / BUILD"

if command -v npm >/dev/null 2>&1; then
  echo "Running TypeScript check..."
  if npx tsc --noEmit >/tmp/course_generator_tsc.log 2>&1; then
    pass "TypeScript check passed"
  else
    warn "TypeScript check failed"
    grep -E "error TS" /tmp/course_generator_tsc.log | head -50 || true
  fi
else
  warn "npm not found; skipped tsc/build"
fi

section "9) HIGH-SIGNAL TODO / FIXME / HACK SEARCH"

if grep -RInE "TODO|FIXME|HACK|XXX|TEMP|mock|smoke test|placeholder" app lib scripts supabase 2>/dev/null >/tmp/course_generator_todos.log; then
  warn "Found TODO/FIXME/HACK markers"
  head -100 /tmp/course_generator_todos.log
else
  pass "No obvious TODO/FIXME/HACK markers found"
fi

section "10) FINAL RISK SUMMARY"

missing=0

for f in \
  "lib/curriculum/types.ts" \
  "lib/curriculum/validator.ts" \
  "lib/curriculum/lesson-contract.schema.json" \
  "lib/curriculum/audit-alignment.ts" \
  "app/api/lessons/[lessonId]/complete/route.ts"
do
  if [ ! -f "$f" ]; then
    missing=$((missing+1))
  fi
done

echo
if [ "$missing" -eq 0 ]; then
  pass "Core files are present"
else
  fail "$missing core file(s) missing"
fi

echo
echo "Audit complete."
