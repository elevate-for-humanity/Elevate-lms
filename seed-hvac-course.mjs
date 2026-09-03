/**
 * Seed HVAC course into the DB-driven LMS engine.
 *
 * Creates:
 *   1. courses row (id = f0593164-55be-5867-98e7-8a86770a8dd0)
 *   2. course_modules rows (10 modules)
 *   3. course_lessons rows (95 lessons, sourced from curriculum_lessons)
 *   4. program_course_map entry
 *   5. program_course_links entry
 */

import { createClient } from '@supabase/supabase-js';

import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const COURSE_ID = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';
const PROGRAM_ID = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';
const ORG_ID_QUERY = `SELECT id FROM organizations WHERE slug = 'elevate-for-humanity' LIMIT 1`;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── helpers ──────────────────────────────────────────────────────────────────

function ok(label, data, error) {
  if (error) {
    console.error(`❌ ${label}:`, error.message);
    process.exit(1);
  }
  console.info(`✅ ${label}`);
  return data;
}

// ── 1. Get org_id ─────────────────────────────────────────────────────────────

const { data: orgs } = await supabase
  .from('organizations')
  .select('id')
  .eq('slug', 'elevate-for-humanity')
  .limit(1);
const orgId = orgs?.[0]?.id ?? null;
console.info('org_id:', orgId);

// ── 2. Upsert courses row ─────────────────────────────────────────────────────

const { data: course, error: courseErr } = await supabase
  .from('courses')
  .upsert(
    {
      id: COURSE_ID,
      program_id: PROGRAM_ID,
      slug: 'hvac-technician',
      title: 'HVAC Technician',

      short_description:
        'EPA 608 certified HVAC technician training — 10 modules, 95 lessons, checkpoint-gated.',
      description:
        'Comprehensive HVAC technician training covering refrigeration fundamentals, EPA 608 certification, system diagnostics, installation, and service. Includes WIOA funding eligibility and DOL apprenticeship pathway.',
      status: 'published',
      is_active: true,
      review_status: 'published',
      total_lessons: 95,
      duration_hours: 47,
      org_id: orgId,
      version: 1,
      published_at: new Date().toISOString(),
    },
    { onConflict: 'slug' },
  )
  .select()
  .single();
ok('courses upsert', course, courseErr);

// ── 3. Load curriculum_lessons ────────────────────────────────────────────────

const { data: clLessons, error: clErr } = await supabase
  .from('curriculum_lessons')
  .select('*')
  .eq('program_id', PROGRAM_ID)
  .eq('status', 'published')
  .order('module_order')
  .order('lesson_order');
ok(`curriculum_lessons loaded (${clLessons?.length})`, clLessons, clErr);

// ── 4. Build module groups ────────────────────────────────────────────────────

const MODULE_TITLES = {
  1: 'Orientation & HVAC Fundamentals',
  2: 'Refrigeration Principles',
  3: 'Electrical Systems & Controls',
  4: 'Air Distribution & Ventilation',
  5: 'Heating Systems',
  6: 'EPA 608 Certification Prep',
  7: 'System Diagnostics & Troubleshooting',
  8: 'Installation & Startup',
  9: 'Preventive Maintenance & Service',
  10: 'Career Readiness & Certification',
};

const moduleGroups = {};
for (const lesson of clLessons) {
  const m = lesson.module_order;
  if (!moduleGroups[m]) moduleGroups[m] = [];
  moduleGroups[m].push(lesson);
}

// ── 5. Upsert course_modules ──────────────────────────────────────────────────

const moduleIdMap = {}; // module_order → course_modules.id

for (const [modOrder, lessons] of Object.entries(moduleGroups)) {
  const totalMins = lessons.reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
  // Deterministic UUID v5-style using a fixed namespace + module order
  // Use crypto.randomUUID seeded by module order for reproducibility
  const modId = `4226f7f6-fbc1-44b5-${String(modOrder).padStart(4, '0')}-${String(modOrder).padStart(12, '0')}`;

  const { data: mod, error: modErr } = await supabase
    .from('course_modules')
    .upsert(
      {
        id: modId,
        course_id: COURSE_ID,
        title: MODULE_TITLES[modOrder] ?? `Module ${modOrder}`,
        order_index: parseInt(modOrder),
        duration_minutes: totalMins,
        is_required: true,
        is_published: true,
        is_draft: false,
        org_id: orgId,
      },
      { onConflict: 'id' },
    )
    .select('id')
    .single();
  ok(`  module ${modOrder}: ${MODULE_TITLES[modOrder]}`, mod, modErr);
  moduleIdMap[modOrder] = mod.id;
}

// ── 6. Upsert course_lessons ──────────────────────────────────────────────────

const ACTIVITY_MAP = {
  lesson: ['video', 'reading', 'flashcards', 'practice'],
  checkpoint: ['video', 'reading', 'flashcards', 'practice', 'checkpoint'],
  quiz: ['video', 'flashcards', 'practice', 'quiz'],
  exam: ['video', 'flashcards', 'practice', 'exam'],
  lab: ['video', 'reading', 'lab'],
  assignment: ['video', 'reading', 'assignment'],
};

let lessonCount = 0;
for (const cl of clLessons) {
  const activities = ACTIVITY_MAP[cl.step_type] ?? ACTIVITY_MAP.lesson;
  const lessonId = `hvac-${cl.lesson_slug}`;

  const { error: lessonErr } = await supabase.from('course_lessons').upsert(
    {
      id: lessonId,
      course_id: COURSE_ID,
      module_id: moduleIdMap[cl.module_order],
      legacy_curriculum_id: cl.id,
      slug: cl.lesson_slug,
      title: cl.lesson_title,
      lesson_type: cl.step_type,
      order_index: cl.lesson_order,
      duration_minutes: cl.duration_minutes ?? 35,
      passing_score: cl.passing_score ?? null,
      quiz_questions: cl.quiz_questions ?? null,
      content: cl.content ?? null,
      activities: activities,
      status: 'published',
      is_published: true,
      is_required: true,
      org_id: orgId,
      version: 1,
    },
    { onConflict: 'id' },
  );

  if (lessonErr) {
    console.error(`❌ lesson ${cl.lesson_slug}:`, lessonErr.message);
  } else {
    lessonCount++;
  }
}
console.info(`✅ course_lessons upserted: ${lessonCount}/95`);

// ── 7. program_course_map ─────────────────────────────────────────────────────

const { error: mapErr } = await supabase
  .from('program_course_map')
  .upsert(
    { program_slug: 'hvac-technician', course_id: COURSE_ID, org_id: orgId },
    { onConflict: 'program_slug' },
  );
ok('program_course_map', true, mapErr);

// ── 8. program_course_links ───────────────────────────────────────────────────

const { error: linkErr } = await supabase.from('program_course_links').upsert(
  {
    program_id: PROGRAM_ID,
    course_id: COURSE_ID,
    org_id: orgId,
    is_primary: true,
    status: 'active',
    priority: 1,
  },
  { onConflict: 'program_id,course_id' },
);
ok('program_course_links', true, linkErr);

// ── 9. Summary ────────────────────────────────────────────────────────────────

console.info('\n=== HVAC COURSE SEEDED ===');
console.info(`Course ID:  ${COURSE_ID}`);
console.info(`Program ID: ${PROGRAM_ID}`);
console.info(`Modules:    ${Object.keys(moduleGroups).length}`);
console.info(`Lessons:    ${lessonCount}`);
console.info(`LMS URL:    /lms/courses/${COURSE_ID}`);
