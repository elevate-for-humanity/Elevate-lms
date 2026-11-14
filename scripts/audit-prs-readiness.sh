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

section "PRS COURSE GENERATOR READINESS"
info "Program slug: $PROGRAM_SLUG"
info "Credential code: $CREDENTIAL_CODE"

section "1) CORE FILES"

required_files=(
  "lib/curriculum/types.ts"
  "lib/curriculum/validator.ts"
  "lib/curriculum/lesson-contract.schema.json"
  "lib/curriculum/audit-alignment.ts"
  "app/api/lessons/[lessonId]/complete/route.ts"
)

missing_core=0
for f in "${required_files[@]}"; do
  if [ -f "$f" ]; then
    pass "Found $f"
  else
    fail "Missing $f"
    missing_core=$((missing_core+1))
  fi
done

section "2) PRS-SPECIFIC REFERENCES IN REPO"

if grep -RInE "$PROGRAM_SLUG|peer-recovery|PRS|$CREDENTIAL_CODE" app lib scripts supabase 2>/dev/null > "$tmpdir/prs_refs.txt"; then
  pass "PRS references found"
  head -50 "$tmpdir/prs_refs.txt"
else
  fail "No PRS references found in app/lib/scripts/supabase"
fi

section "3) GENERATOR / AUDIT / PUBLISH PATHS"

checks=(
  "scoreCompetencyFidelity|Competency fidelity scoring exists"
  "scoreExamRelevance|Exam relevance scoring exists"
  "fidelity_gate|Per-competency fidelity gate exists"
  "competency_fidelity|Per-competency fidelity tracking exists"
  "publish-generated-lessons|Publish script exists by name"
  "summary_text|Summary field exists in code"
  "reflection_prompt|Reflection field exists in code"
  "competency_codes|Competency code traceability exists"
  "question_bank|Question bank references exist"
  "practice_exam_blueprints|Practice exam blueprint references exist"
)

for entry in "${checks[@]}"; do
  pattern="${entry%%|*}"
  label="${entry##*|}"
  if grep -RInE "$pattern" . 2>/dev/null > /dev/null; then
    pass "$label"
  else
    warn "$label"
  fi
done

section "4) LEGACY LEAK CHECK"

if grep -RInE "from\(['\"]training_lessons['\"]\)" app lib 2>/dev/null > "$tmpdir/training_lessons.txt"; then
  warn "Lingering training_lessons references found"
  cat "$tmpdir/training_lessons.txt" | head -50
else
  pass "No training_lessons references in app/lib"
fi

if grep -RInE "course_progress" app lib supabase 2>/dev/null > "$tmpdir/course_progress.txt"; then
  warn "Lingering course_progress references found"
  cat "$tmpdir/course_progress.txt" | head -50
else
  pass "No course_progress references found"
fi

if grep -RInE "lesson_progress" app lib supabase 2>/dev/null > /dev/null; then
  pass "lesson_progress references exist"
else
  warn "lesson_progress references missing"
fi

section "5) LMS READ PATH"

paths=(
  "app/lms/(app)/courses/[courseId]/page.tsx"
  "app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx"
  "app/lms/(app)/program/[programId]/page.tsx"
)

for p in "${paths[@]}"; do
  if [ -f "$p" ]; then
    pass "Found $p"
    if grep -nE "lms_lessons|curriculum_lessons" "$p" > /dev/null 2>&1; then
      pass "Uses LMS/curriculum lesson source: $p"
      grep -nE "lms_lessons|curriculum_lessons" "$p" | head -10
    else
      warn "Does not clearly reference lms_lessons/curriculum_lessons: $p"
    fi
  else
    warn "Missing expected LMS route: $p"
  fi
done

section "6) COMPLETION / ELIGIBILITY WIRING"

route="app/api/lessons/[lessonId]/complete/route.ts"
if [ -f "$route" ]; then
  if grep -n "checkEligibilityAndAuthorize" "$route" > /dev/null 2>&1; then
    pass "Eligibility hook wired in completion route"
    grep -n "checkEligibilityAndAuthorize" "$route" | head -10
  else
    warn "Eligibility hook not found in completion route"
  fi

  if grep -nE "lesson_progress|from\(['\"]lms_lessons['\"]\)|from\(['\"]curriculum_lessons['\"]\)" "$route" > /dev/null 2>&1; then
    pass "Completion route appears wired to current lesson system"
    grep -nE "lesson_progress|from\(['\"]lms_lessons['\"]\)|from\(['\"]curriculum_lessons['\"]\)" "$route" | head -20
  else
    warn "Completion route may still be using wrong lesson source"
  fi
else
  fail "Missing completion route"
fi

section "7) CURRICULUM TABLE / MIGRATION SIGNALS"

migration_checks=(
  "curriculum_lessons|curriculum_lessons in migrations"
  "credential_blueprint_competencies|competency blueprint table in migrations"
  "curriculum_lesson_competencies|lesson-competency traceability in migrations"
  "summary_text|summary_text in migrations"
  "reflection_prompt|reflection_prompt in migrations"
  "competency_codes|competency_codes in migrations"
)

for entry in "${migration_checks[@]}"; do
  pattern="${entry%%|*}"
  label="${entry##*|}"
  if grep -RInE "$pattern" supabase/migrations supabase 2>/dev/null > /dev/null; then
    pass "$label"
  else
    warn "$label"
  fi
done

section "8) PRS LESSON / COMPETENCY FILE CANDIDATES"

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.sql" -o -name "*.json" \) 2>/dev/null \
  | grep -Ei "prs|peer-recovery|recovery|competenc|curriculum|publish|generate|audit" \
  | grep -v node_modules | grep -v ".next" \
  | sed 's#^\./##' \
  | sort \
  | head -300

section "9) TODO / FIXME / PLACEHOLDER SCAN"

if grep -RInE "TODO|FIXME|HACK|XXX|TEMP|placeholder|smoke test|mock|stub" app lib scripts supabase 2>/dev/null > "$tmpdir/todos.txt"; then
  warn "Found TODO/FIXME/placeholder markers"
  cat "$tmpdir/todos.txt" | head -100
else
  pass "No obvious TODO/FIXME/placeholder markers found"
fi

section "10) TYPECHECK"

if command -v npx >/dev/null 2>&1; then
  if npx tsc --noEmit > "$tmpdir/tsc.log" 2>&1; then
    pass "TypeScript check passed"
  else
    warn "TypeScript check failed"
    grep -E "error TS" "$tmpdir/tsc.log" | head -80 || tail -80 "$tmpdir/tsc.log"
  fi
else
  warn "npx not available; skipped TypeScript check"
fi

section "11) READINESS SCORECARD"

score=0
max=8

[ "$missing_core" -eq 0 ] && score=$((score+1))

grep -RInE "fidelity_gate" . > /dev/null 2>&1 && score=$((score+1)) || true
grep -RInE "competency_fidelity" . > /dev/null 2>&1 && score=$((score+1)) || true
! grep -RInE "from\(['\"]training_lessons['\"]\)" app lib > /dev/null 2>&1 && score=$((score+1)) || true
[ -f "$route" ] && grep -RInE "checkEligibilityAndAuthorize" "$route" > /dev/null 2>&1 && score=$((score+1)) || true
grep -RInE "summary_text" . > /dev/null 2>&1 && score=$((score+1)) || true
grep -RInE "reflection_prompt" . > /dev/null 2>&1 && score=$((score+1)) || true
grep -RInE "competency_codes" . > /dev/null 2>&1 && score=$((score+1)) || true

echo
echo "PRS readiness score: $score / $max"

if [ "$score" -ge 7 ]; then
  pass "Repo looks close. Next step is runtime proof: generate -> audit -> publish -> learner flow."
elif [ "$score" -ge 5 ]; then
  warn "Repo looks partially ready, but still has real gaps."
else
  fail "Repo is not ready for automated PRS generation."
fi

section "12) WHAT STILL HAS TO BE PROVEN"

cat <<EOF
You are NOT done until all of these are proven in reality:

1. Generator creates PRS lessons at full volume
   - expected: about 35-40 lessons for 5 domains / 25 competencies

2. Audit passes on generated lessons
   - strong lesson pass rate
   - per-competency fidelity gate passes
   - no unsupported competencies

3. Publish writes into curriculum_lessons correctly
   - summary_text present
   - reflection_prompt present
   - competency_codes present

4. LMS learner path reads generated lessons
   - course page
   - lesson page
   - program page

5. Completion route records progress and triggers eligibility
   - lesson_progress updated
   - checkEligibilityAndAuthorize fires
   - downstream credential logic works

6. No hidden fallback is serving old training data
EOF

echo
pass "PRS audit script finished"
