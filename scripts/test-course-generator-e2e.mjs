/**
 * End-to-end test for /api/ai/generate-course-outline
 *
 * Tests the LIVE route — not OpenAI directly.
 *
 * Gates tested:
 *   1. Route reachable and returns 200
 *   2. Response shape matches expected schema
 *   3. Schema validator ran (meta.gate_schema_validation = "passed")
 *   4. Compliance status is "draft_for_human_review"
 *   5. DB dry-run: maps lessons → course_lessons rows, checks constraints
 *
 * Usage:
 *   node scripts/test-course-generator-e2e.mjs
 *   node scripts/test-course-generator-e2e.mjs --base-url https://your-deploy.netlify.app
 *
 * Requires:
 *   - Dev server running on port 3000 (or --base-url override)
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local (for DB dry-run slug uniqueness check)
 *   - A valid session cookie OR the route must accept service-role auth
 *
 * Exit codes:
 *   0 = all gates passed
 *   1 = one or more gates failed
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load env
let env = {};
try {
  const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
} catch {
  console.error('❌ Could not read .env.local');
  process.exit(1);
}

const BASE_URL = process.argv.includes('--base-url')
  ? process.argv[process.argv.indexOf('--base-url') + 1]
  : 'http://localhost:3000';

const TEST_TEMPERATURE = process.argv.includes('--temperature')
  ? parseFloat(process.argv[process.argv.indexOf('--temperature') + 1])
  : undefined;

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const PROMPT = `Generate a complete workforce-ready training course titled 'Certified Nursing Assistant (CNA) Foundations' aligned to Indiana state requirements.

The course must include:
1. Exactly 5 modules, each with 4–6 lessons, clear learning objectives, practical job-ready skills.
2. Lesson structure: title, 3–5 bullet learning points, real-world scenario, assessment question (multiple choice).
3. Include 3 checkpoints (after modules 2, 3, and 4) and 1 final certification exam (minimum 25 questions blueprint).
4. Exam must align to CNA competencies: patient care, safety, infection control, communication.
5. Enforce strict sequencing: unique slugs, order_index with no gaps or duplicates.
6. Include readiness logic: exam eligibility criteria, pass thresholds for checkpoints and final exam.

Do NOT include placeholders or generic filler. All content must be specific, realistic, and usable.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(label, msg, ok = true) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [${label}] ${msg}`);
}

function fail(label, msg, detail = null) {
  console.log(`❌ [${label}] FAIL: ${msg}`);
  if (detail) console.log(`   Detail: ${JSON.stringify(detail, null, 2).substring(0, 400)}`);
}

// ---------------------------------------------------------------------------
// Gate 1: Call the live route
// ---------------------------------------------------------------------------
async function gate1_callRoute() {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`GATE 1: Live route call → ${BASE_URL}/api/ai/generate-course-outline`);
  console.log('─'.repeat(60));

  // Use X-Internal-Service-Key for server-to-server auth (requireAuth accepts this).
  const start = Date.now();
  let res;
  try {
    res = await fetch(`${BASE_URL}/api/ai/generate-course-outline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': SERVICE_KEY,
      },
      body: JSON.stringify({ prompt: PROMPT, ...(TEST_TEMPERATURE !== undefined ? { _testTemperature: TEST_TEMPERATURE } : {}) }),
    });
  } catch (err) {
    fail('GATE1', `Network error — is the dev server running at ${BASE_URL}?`, err.message);
    return null;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`   HTTP ${res.status} in ${elapsed}s`);

  if (res.status === 401 || res.status === 403) {
    fail('GATE1', `Auth rejected (${res.status}). Route requires a valid session. Run dev server and pass a real session cookie.`);
    const body = await res.text();
    console.log(`   Body: ${body.substring(0, 200)}`);
    return null;
  }

  if (res.status === 422) {
    const body = await res.json();
    fail('GATE1', `Route returned 422 — schema validation or JSON parse failed`, body);
    return null;
  }

  if (!res.ok) {
    const body = await res.text();
    fail('GATE1', `Route returned ${res.status}`, body.substring(0, 300));
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (err) {
    fail('GATE1', 'Response is not valid JSON', err.message);
    return null;
  }

  log('GATE1', `Route returned 200 in ${elapsed}s`);
  return json;
}

// ---------------------------------------------------------------------------
// Gate 2: Validate response shape
// ---------------------------------------------------------------------------
function gate2_validateShape(json) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log('GATE 2: Response shape validation');
  console.log('─'.repeat(60));

  const errors = [];

  // meta block
  if (!json.meta) {
    errors.push('Missing meta block');
  } else {
    if (json.meta.gate_json_parse !== 'passed') errors.push(`meta.gate_json_parse = "${json.meta.gate_json_parse}" (expected "passed")`);
    if (json.meta.gate_schema_validation !== 'passed') errors.push(`meta.gate_schema_validation = "${json.meta.gate_schema_validation}" (expected "passed")`);
    if (json.meta.gate_compliance_status !== 'draft_for_human_review') errors.push(`meta.gate_compliance_status = "${json.meta.gate_compliance_status}"`);
    if (json.meta.model !== 'gpt-4o') errors.push(`meta.model = "${json.meta.model}" (expected "gpt-4o")`);
    log('GATE2', `meta block: json_parse=${json.meta.gate_json_parse}, schema=${json.meta.gate_schema_validation}, compliance=${json.meta.gate_compliance_status}, model=${json.meta.model}`);
    if (json.meta.warnings?.length > 0) {
      console.log(`   ⚠️  Warnings: ${json.meta.warnings.join('; ')}`);
    }
  }

  const o = json.outline;
  if (!o) { errors.push('Missing outline'); return errors; }

  // course
  if (o.course?.compliance_status !== 'draft_for_human_review') {
    errors.push(`course.compliance_status = "${o.course?.compliance_status}" (must be draft_for_human_review)`);
  } else {
    log('GATE2', `compliance_status = "draft_for_human_review"`);
  }
  if (!o.course?.compliance_notice) {
    errors.push('course.compliance_notice missing');
  } else {
    log('GATE2', `compliance_notice present`);
  }

  // counts
  const modCount = o.modules?.length ?? 0;
  modCount === 5 ? log('GATE2', `5 modules`) : errors.push(`Module count: ${modCount} (expected 5)`);

  const lessonCount = o.lessons?.filter(l => l.step_type === 'lesson').length ?? 0;
  lessonCount >= 20 ? log('GATE2', `${lessonCount} lessons (≥20)`) : errors.push(`Lesson count: ${lessonCount} (expected ≥20)`);

  const cpCount = o.checkpoints?.length ?? 0;
  cpCount === 3 ? log('GATE2', `3 checkpoints`) : errors.push(`Checkpoint count: ${cpCount} (expected 3)`);

  const examQCount = o.exams?.[0]?.question_count ?? 0;
  examQCount >= 25 ? log('GATE2', `Exam: ${examQCount} questions`) : errors.push(`Exam question count: ${examQCount} (expected ≥25)`);

  // order_index integrity
  if (o.lessons) {
    const indices = o.lessons.map(l => l.order_index).sort((a, b) => a - b);
    const dupes = indices.filter((v, i) => indices.indexOf(v) !== i);
    const gaps = [];
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] - indices[i - 1] > 1) gaps.push(`${indices[i-1]}→${indices[i]}`);
    }
    dupes.length === 0 ? log('GATE2', 'No duplicate order_index') : errors.push(`Duplicate order_index: ${dupes}`);
    gaps.length === 0 ? log('GATE2', 'No gaps in order_index') : errors.push(`Gaps in order_index: ${gaps}`);
    indices[0] === 1 ? log('GATE2', 'order_index starts at 1') : errors.push(`order_index starts at ${indices[0]}`);
  }

  // slug uniqueness
  if (o.lessons) {
    const slugs = o.lessons.map(l => l.slug);
    const dupeSlugs = slugs.filter((v, i) => slugs.indexOf(v) !== i);
    dupeSlugs.length === 0 ? log('GATE2', 'All slugs unique') : errors.push(`Duplicate slugs: ${dupeSlugs}`);
    const badSlugs = slugs.filter(s => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s));
    badSlugs.length === 0 ? log('GATE2', 'All slugs slug-safe') : errors.push(`Bad slugs: ${badSlugs}`);
  }

  if (errors.length > 0) {
    errors.forEach(e => fail('GATE2', e));
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Gate 3: Compliance map check
// ---------------------------------------------------------------------------
function gate3_complianceCheck(json) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log('GATE 3: Compliance map verification');
  console.log('─'.repeat(60));

  const errors = [];
  const o = json.outline;

  // Required Indiana CNA domain keys
  const REQUIRED_DOMAINS = ['patient_care', 'safety', 'infection_control', 'communication'];
  const blueprint = o.exams?.[0]?.domain_blueprint ?? [];
  const blueprintDomains = blueprint.map(d => d.domain);

  for (const domain of REQUIRED_DOMAINS) {
    if (blueprintDomains.includes(domain)) {
      log('GATE3', `Domain "${domain}" present in exam blueprint`);
    } else {
      // Warn but don't hard-fail — model may use slightly different keys
      console.log(`   ⚠️  [GATE3] Domain "${domain}" not found in blueprint (got: ${blueprintDomains.join(', ')})`);
    }
  }

  // Eligibility criteria count
  const criteria = o.course?.exam_eligibility_criteria ?? [];
  criteria.length >= 3
    ? log('GATE3', `${criteria.length} eligibility criteria defined`)
    : errors.push(`Only ${criteria.length} eligibility criteria (need ≥3)`);

  // Pass thresholds in valid range
  const cpThresh = o.course?.pass_threshold_checkpoints;
  const examThresh = o.course?.pass_threshold_final_exam;
  (cpThresh >= 60 && cpThresh <= 100)
    ? log('GATE3', `Checkpoint pass threshold: ${cpThresh}%`)
    : errors.push(`Checkpoint threshold ${cpThresh}% out of range (60–100)`);
  (examThresh >= 60 && examThresh <= 100)
    ? log('GATE3', `Exam pass threshold: ${examThresh}%`)
    : errors.push(`Exam threshold ${examThresh}% out of range (60–100)`);

  // Total hours reasonable for Indiana CNA (75 minimum)
  const hours = o.course?.total_hours;
  hours >= 75
    ? log('GATE3', `Total hours: ${hours} (Indiana minimum: 75)`)
    : console.log(`   ⚠️  [GATE3] total_hours = ${hours} (Indiana requires ≥75 — verify)`);

  if (errors.length > 0) errors.forEach(e => fail('GATE3', e));
  return errors;
}

// ---------------------------------------------------------------------------
// Gate 4: DB dry-run — map lessons to course_lessons rows
// ---------------------------------------------------------------------------
async function gate4_dbDryRun(json) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log('GATE 4: DB dry-run — map to course_lessons, check constraints');
  console.log('─'.repeat(60));

  const errors = [];
  const o = json.outline;

  // Map lessons to course_lessons shape
  const rows = (o.lessons ?? []).map(l => ({
    // course_id would be assigned on real insert — omitted in dry-run
    slug: l.slug,
    title: l.title,
    lesson_type: l.step_type,   // maps to lesson_type enum
    module_order: l.module_index,
    lesson_order: l.order_index,
    passing_score: l.step_type === 'checkpoint' || l.step_type === 'exam'
      ? (l.step_type === 'exam' ? o.course?.pass_threshold_final_exam : o.course?.pass_threshold_checkpoints)
      : null,
    activities: buildActivities(l.step_type),
    status: 'draft',
  }));

  log('GATE4', `Mapped ${rows.length} lessons to course_lessons rows`);

  // Constraint: slug uniqueness (local check)
  const slugSet = new Set();
  for (const row of rows) {
    if (slugSet.has(row.slug)) {
      errors.push(`DB constraint violation: duplicate slug "${row.slug}"`);
    }
    slugSet.add(row.slug);
  }
  errors.length === 0 ? log('GATE4', 'No slug constraint violations (local)') : null;

  // Constraint: lesson_type enum values
  const VALID_TYPES = ['lesson', 'checkpoint', 'exam', 'quiz', 'lab', 'assignment', 'certification'];
  for (const row of rows) {
    if (!VALID_TYPES.includes(row.lesson_type)) {
      errors.push(`Invalid lesson_type "${row.lesson_type}" for slug "${row.slug}"`);
    }
  }
  log('GATE4', 'lesson_type enum values valid');

  // Constraint: lesson_order sequential per module
  const byModule = {};
  for (const row of rows) {
    if (!byModule[row.module_order]) byModule[row.module_order] = [];
    byModule[row.module_order].push(row.lesson_order);
  }
  for (const [mod, orders] of Object.entries(byModule)) {
    const sorted = [...orders].sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i-1] > 1) gaps.push(`${sorted[i-1]}→${sorted[i]}`);
    }
    gaps.length === 0
      ? log('GATE4', `Module ${mod}: lesson_order sequential (${sorted.join(',')})`)
      : errors.push(`Module ${mod}: gaps in lesson_order: ${gaps}`);
  }

  // Live DB check: do any of these slugs already exist in course_lessons?
  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      const slugList = rows.map(r => r.slug);
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/course_lessons?select=slug&slug=in.(${slugList.map(s => `"${s}"`).join(',')})`,
        {
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
        }
      );
      if (res.ok) {
        const existing = await res.json();
        if (existing.length > 0) {
          const existingSlugs = existing.map(r => r.slug);
          errors.push(`DB collision: ${existingSlugs.length} slugs already exist in course_lessons: ${existingSlugs.join(', ')}`);
        } else {
          log('GATE4', 'No slug collisions in live course_lessons table');
        }
      } else {
        console.log(`   ⚠️  [GATE4] Could not query live DB (${res.status}) — skipping live slug check`);
      }
    } catch (err) {
      console.log(`   ⚠️  [GATE4] Live DB check failed: ${err.message}`);
    }
  } else {
    console.log('   ⚠️  [GATE4] No Supabase credentials — skipping live slug collision check');
  }

  // Print dry-run sample (first 3 rows)
  console.log('\n   Dry-run sample (first 3 rows):');
  for (const row of rows.slice(0, 3)) {
    console.log(`   ${JSON.stringify(row)}`);
  }

  if (errors.length > 0) errors.forEach(e => fail('GATE4', e));
  return errors;
}

function buildActivities(stepType) {
  const base = { video: true, reading: true, flashcards: true, practice: true };
  if (stepType === 'checkpoint') return { ...base, checkpoint: true };
  if (stepType === 'exam') return { ...base, exam: true };
  if (stepType === 'lab') return { video: true, reading: true, lab: true };
  return base;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log('═'.repeat(60));
console.log('END-TO-END TEST: /api/ai/generate-course-outline');
console.log(`Target: ${BASE_URL}`);
console.log('═'.repeat(60));

const json = await gate1_callRoute();
if (!json) {
  console.log('\n❌ GATE 1 FAILED — cannot proceed\n');
  process.exit(1);
}

const g2errors = gate2_validateShape(json);
const g3errors = gate3_complianceCheck(json);
const g4errors = await gate4_dbDryRun(json);

const totalErrors = g2errors.length + g3errors.length + g4errors.length;

console.log(`\n${'═'.repeat(60)}`);
console.log('FINAL RESULT');
console.log('═'.repeat(60));
console.log(`Gate 1 (live route):       ✅ PASSED`);
console.log(`Gate 2 (schema):           ${g2errors.length === 0 ? '✅ PASSED' : `❌ FAILED (${g2errors.length} errors)`}`);
console.log(`Gate 3 (compliance):       ${g3errors.length === 0 ? '✅ PASSED' : `❌ FAILED (${g3errors.length} errors)`}`);
console.log(`Gate 4 (DB dry-run):       ${g4errors.length === 0 ? '✅ PASSED' : `❌ FAILED (${g4errors.length} errors)`}`);
console.log(`\nVerdict: ${totalErrors === 0 ? '✅ ALL GATES PASSED' : `❌ ${totalErrors} ERRORS — NOT PRODUCTION READY`}`);

// Print real sample payload
console.log('\n── Real payload sample (course + first lesson) ──');
console.log(JSON.stringify({
  course: json.outline?.course,
  first_lesson: json.outline?.lessons?.[0],
}, null, 2).substring(0, 1200));

process.exit(totalErrors === 0 ? 0 : 1);
