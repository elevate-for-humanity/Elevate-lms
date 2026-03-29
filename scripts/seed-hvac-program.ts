/**
 * scripts/seed-hvac-program.ts
 *
 * Idempotent seed for the HVAC Technician program relations.
 * Safe to re-run — uses upsert on all tables.
 *
 * Usage:
 *   pnpm tsx scripts/seed-hvac-program.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

const PROGRAM_ID = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';

// ── Module definitions ────────────────────────────────────────────────────────

const MODULES: Array<{
  module_number: number;
  title: string;
  description: string;
  lesson_count: number;
  duration_hours: number;
  sort_order: number;
  lessons: Array<{
    lesson_number: number;
    title: string;
    lesson_type: 'lesson' | 'quiz' | 'lab' | 'exam' | 'orientation';
    duration_minutes: number;
    sort_order: number;
  }>;
}> = [
  {
    module_number: 1, sort_order: 1, lesson_count: 8, duration_hours: 6,
    title: 'HVAC Fundamentals',
    description: 'How heating and cooling systems work. Tools, safety, and industry standards.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson',      duration_minutes: 30, sort_order: 1, title: 'Introduction to HVAC Systems' },
      { lesson_number: 2, lesson_type: 'lesson',      duration_minutes: 25, sort_order: 2, title: 'Tools and Safety Equipment' },
      { lesson_number: 3, lesson_type: 'lesson',      duration_minutes: 30, sort_order: 3, title: 'Industry Standards and Codes' },
      { lesson_number: 4, lesson_type: 'lesson',      duration_minutes: 35, sort_order: 4, title: 'Heat Transfer Principles' },
      { lesson_number: 5, lesson_type: 'lesson',      duration_minutes: 30, sort_order: 5, title: 'Air Distribution Basics' },
      { lesson_number: 6, lesson_type: 'lesson',      duration_minutes: 30, sort_order: 6, title: 'Ductwork and Airflow' },
      { lesson_number: 7, lesson_type: 'lesson',      duration_minutes: 25, sort_order: 7, title: 'Ventilation and Indoor Air Quality' },
      { lesson_number: 8, lesson_type: 'quiz',        duration_minutes: 20, sort_order: 8, title: 'Module 1 Checkpoint' },
    ],
  },
  {
    module_number: 2, sort_order: 2, lesson_count: 8, duration_hours: 6,
    title: 'Electrical Systems',
    description: 'Wiring, circuits, controls, and electrical diagnostics on real HVAC equipment.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson', duration_minutes: 35, sort_order: 1, title: 'Electrical Fundamentals for HVAC' },
      { lesson_number: 2, lesson_type: 'lesson', duration_minutes: 30, sort_order: 2, title: 'Reading Wiring Diagrams' },
      { lesson_number: 3, lesson_type: 'lesson', duration_minutes: 30, sort_order: 3, title: 'Motors and Capacitors' },
      { lesson_number: 4, lesson_type: 'lesson', duration_minutes: 25, sort_order: 4, title: 'Contactors and Relays' },
      { lesson_number: 5, lesson_type: 'lesson', duration_minutes: 30, sort_order: 5, title: 'Thermostats and Controls' },
      { lesson_number: 6, lesson_type: 'lab',    duration_minutes: 45, sort_order: 6, title: 'Electrical Diagnostics Lab' },
      { lesson_number: 7, lesson_type: 'lesson', duration_minutes: 20, sort_order: 7, title: 'Safety and Lockout/Tagout' },
      { lesson_number: 8, lesson_type: 'quiz',   duration_minutes: 20, sort_order: 8, title: 'Module 2 Checkpoint' },
    ],
  },
  {
    module_number: 3, sort_order: 3, lesson_count: 9, duration_hours: 7,
    title: 'Refrigeration Cycle',
    description: 'Refrigerant handling, pressure-temperature relationships, and EPA 608 core concepts.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson', duration_minutes: 35, sort_order: 1, title: 'Refrigeration Cycle Overview' },
      { lesson_number: 2, lesson_type: 'lesson', duration_minutes: 30, sort_order: 2, title: 'Refrigerants and Properties' },
      { lesson_number: 3, lesson_type: 'lesson', duration_minutes: 35, sort_order: 3, title: 'Pressure-Temperature Relationships' },
      { lesson_number: 4, lesson_type: 'lesson', duration_minutes: 30, sort_order: 4, title: 'Compressors' },
      { lesson_number: 5, lesson_type: 'lesson', duration_minutes: 30, sort_order: 5, title: 'Condensers and Evaporators' },
      { lesson_number: 6, lesson_type: 'lesson', duration_minutes: 25, sort_order: 6, title: 'Metering Devices' },
      { lesson_number: 7, lesson_type: 'lab',    duration_minutes: 45, sort_order: 7, title: 'Refrigerant Handling Lab' },
      { lesson_number: 8, lesson_type: 'lesson', duration_minutes: 40, sort_order: 8, title: 'EPA 608 Core Concepts' },
      { lesson_number: 9, lesson_type: 'quiz',   duration_minutes: 20, sort_order: 9, title: 'Module 3 Checkpoint' },
    ],
  },
  {
    module_number: 4, sort_order: 4, lesson_count: 8, duration_hours: 7,
    title: 'System Installation',
    description: 'Installing residential AC units, furnaces, and heat pumps to manufacturer and code specifications.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson', duration_minutes: 30, sort_order: 1, title: 'Site Assessment and Planning' },
      { lesson_number: 2, lesson_type: 'lesson', duration_minutes: 40, sort_order: 2, title: 'Residential AC Installation' },
      { lesson_number: 3, lesson_type: 'lesson', duration_minutes: 40, sort_order: 3, title: 'Furnace Installation' },
      { lesson_number: 4, lesson_type: 'lesson', duration_minutes: 40, sort_order: 4, title: 'Heat Pump Installation' },
      { lesson_number: 5, lesson_type: 'lesson', duration_minutes: 35, sort_order: 5, title: 'Ductwork Installation' },
      { lesson_number: 6, lesson_type: 'lesson', duration_minutes: 30, sort_order: 6, title: 'Startup and Commissioning' },
      { lesson_number: 7, lesson_type: 'lab',    duration_minutes: 60, sort_order: 7, title: 'Installation Lab' },
      { lesson_number: 8, lesson_type: 'quiz',   duration_minutes: 20, sort_order: 8, title: 'Module 4 Checkpoint' },
    ],
  },
  {
    module_number: 5, sort_order: 5, lesson_count: 8, duration_hours: 6,
    title: 'System Repair',
    description: 'Diagnosing and repairing common failures in residential and light commercial HVAC systems.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson', duration_minutes: 30, sort_order: 1, title: 'Diagnostic Approach and Process' },
      { lesson_number: 2, lesson_type: 'lesson', duration_minutes: 35, sort_order: 2, title: 'Compressor Failures' },
      { lesson_number: 3, lesson_type: 'lesson', duration_minutes: 35, sort_order: 3, title: 'Refrigerant Leaks and Recharge' },
      { lesson_number: 4, lesson_type: 'lesson', duration_minutes: 30, sort_order: 4, title: 'Electrical Component Replacement' },
      { lesson_number: 5, lesson_type: 'lesson', duration_minutes: 25, sort_order: 5, title: 'Airflow and Duct Repairs' },
      { lesson_number: 6, lesson_type: 'lab',    duration_minutes: 60, sort_order: 6, title: 'Repair Lab' },
      { lesson_number: 7, lesson_type: 'lesson', duration_minutes: 20, sort_order: 7, title: 'Customer Communication' },
      { lesson_number: 8, lesson_type: 'quiz',   duration_minutes: 20, sort_order: 8, title: 'Module 5 Checkpoint' },
    ],
  },
  {
    module_number: 6, sort_order: 6, lesson_count: 7, duration_hours: 6,
    title: 'Advanced Diagnostics',
    description: 'System performance testing, fault isolation, and advanced troubleshooting techniques.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson', duration_minutes: 35, sort_order: 1, title: 'System Performance Testing' },
      { lesson_number: 2, lesson_type: 'lesson', duration_minutes: 35, sort_order: 2, title: 'Fault Isolation Techniques' },
      { lesson_number: 3, lesson_type: 'lesson', duration_minutes: 30, sort_order: 3, title: 'Using Diagnostic Tools' },
      { lesson_number: 4, lesson_type: 'lesson', duration_minutes: 35, sort_order: 4, title: 'Heat Pump Diagnostics' },
      { lesson_number: 5, lesson_type: 'lesson', duration_minutes: 30, sort_order: 5, title: 'Commercial System Basics' },
      { lesson_number: 6, lesson_type: 'lab',    duration_minutes: 60, sort_order: 6, title: 'Advanced Diagnostics Lab' },
      { lesson_number: 7, lesson_type: 'quiz',   duration_minutes: 20, sort_order: 7, title: 'Module 6 Checkpoint' },
    ],
  },
  {
    module_number: 7, sort_order: 7, lesson_count: 8, duration_hours: 6,
    title: 'EPA 608 Certification Prep',
    description: 'Targeted preparation for EPA 608 Universal certification — Core, Type I, II, and III sections.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson', duration_minutes: 20, sort_order: 1, title: 'EPA 608 Exam Overview' },
      { lesson_number: 2, lesson_type: 'lesson', duration_minutes: 40, sort_order: 2, title: 'Core Section Review' },
      { lesson_number: 3, lesson_type: 'lesson', duration_minutes: 35, sort_order: 3, title: 'Type I — Small Appliances' },
      { lesson_number: 4, lesson_type: 'lesson', duration_minutes: 35, sort_order: 4, title: 'Type II — High-Pressure Systems' },
      { lesson_number: 5, lesson_type: 'lesson', duration_minutes: 35, sort_order: 5, title: 'Type III — Low-Pressure Systems' },
      { lesson_number: 6, lesson_type: 'quiz',   duration_minutes: 45, sort_order: 6, title: 'Universal Practice Exam 1' },
      { lesson_number: 7, lesson_type: 'quiz',   duration_minutes: 45, sort_order: 7, title: 'Universal Practice Exam 2' },
      { lesson_number: 8, lesson_type: 'exam',   duration_minutes: 90, sort_order: 8, title: 'EPA 608 Proctored Exam' },
    ],
  },
  {
    module_number: 8, sort_order: 8, lesson_count: 5, duration_hours: 10,
    title: 'OSHA 10 Safety',
    description: 'OSHA 10-hour construction safety certification covering hazard recognition and prevention.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson', duration_minutes: 60, sort_order: 1, title: 'Introduction to OSHA' },
      { lesson_number: 2, lesson_type: 'lesson', duration_minutes: 60, sort_order: 2, title: 'Fall Protection' },
      { lesson_number: 3, lesson_type: 'lesson', duration_minutes: 60, sort_order: 3, title: 'Electrical Safety' },
      { lesson_number: 4, lesson_type: 'lesson', duration_minutes: 60, sort_order: 4, title: 'Personal Protective Equipment' },
      { lesson_number: 5, lesson_type: 'exam',   duration_minutes: 60, sort_order: 5, title: 'OSHA 10 Certification Exam' },
    ],
  },
  {
    module_number: 9, sort_order: 9, lesson_count: 3, duration_hours: 4,
    title: 'CPR / First Aid',
    description: 'CPR and First Aid certification required by most HVAC employers for field positions.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson', duration_minutes: 60, sort_order: 1, title: 'CPR Fundamentals' },
      { lesson_number: 2, lesson_type: 'lesson', duration_minutes: 60, sort_order: 2, title: 'First Aid and AED' },
      { lesson_number: 3, lesson_type: 'exam',   duration_minutes: 60, sort_order: 3, title: 'CPR / First Aid Certification' },
    ],
  },
  {
    module_number: 10, sort_order: 10, lesson_count: 5, duration_hours: 4,
    title: 'Career Readiness',
    description: 'Resume building, job placement support, employer introductions, and program wrap-up.',
    lessons: [
      { lesson_number: 1, lesson_type: 'lesson',      duration_minutes: 45, sort_order: 1, title: 'Resume and Interview Prep' },
      { lesson_number: 2, lesson_type: 'lesson',      duration_minutes: 30, sort_order: 2, title: 'Job Search Strategies' },
      { lesson_number: 3, lesson_type: 'lesson',      duration_minutes: 30, sort_order: 3, title: 'Employer Partner Introductions' },
      { lesson_number: 4, lesson_type: 'lesson',      duration_minutes: 25, sort_order: 4, title: 'Licensing and Continuing Education' },
      { lesson_number: 5, lesson_type: 'orientation', duration_minutes: 30, sort_order: 5, title: 'Program Completion and Graduation' },
    ],
  },
];

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding HVAC Technician program relations...\n');

  // 1. programs row — patch headline fields
  const { error: pErr } = await db.from('programs').update({
    hero_headline:    'HVAC Technician Training',
    hero_subheadline: '12 weeks. EPA 608 Universal. $0 for eligible Indiana residents.',
    length_weeks:     12,
    certificate_title: 'EPA 608 Universal Certification',
    funding:   'WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
    outcomes:  'Graduates qualify for entry-level HVAC helper and installer roles ($18–$22/hr) with a clear path to licensed technician ($22–$30/hr).',
    requirements: 'Must be 18 or older. No prior HVAC experience required. Indiana resident preferred for workforce funding eligibility.',
  }).eq('id', PROGRAM_ID);
  if (pErr) { console.error('programs patch failed:', pErr.message); process.exit(1); }
  console.log('✅ programs row patched');

  // 2. program_media — delete and re-insert
  await db.from('program_media').delete().eq('program_id', PROGRAM_ID);
  const { error: mErr } = await db.from('program_media').insert([
    {
      program_id: PROGRAM_ID,
      media_type: 'hero_image',
      url: '/images/pages/programs-hvac-course-hero.jpg',
      alt_text: 'HVAC technician working on an air conditioning unit',
      sort_order: 1,
    },
  ]);
  if (mErr) { console.error('program_media insert failed:', mErr.message); process.exit(1); }
  console.log('✅ program_media inserted');

  // 3. program_ctas — delete and re-insert (no natural unique key)
  await db.from('program_ctas').delete().eq('program_id', PROGRAM_ID);
  const { error: cErr } = await db.from('program_ctas').insert([
    { program_id: PROGRAM_ID, cta_type: 'apply',        label: 'Apply Now',             href: '/programs/hvac-technician/apply',    style_variant: 'primary',   is_external: false, sort_order: 1 },
    { program_id: PROGRAM_ID, cta_type: 'request_info', label: 'Check My Eligibility',  href: '/contact?program=hvac-technician',   style_variant: 'secondary', is_external: false, sort_order: 2 },
  ]);
  if (cErr) { console.error('program_ctas insert failed:', cErr.message); process.exit(1); }
  console.log('✅ program_ctas inserted');

  // 4. program_modules + program_lessons — upsert modules, then lessons per module
  for (const mod of MODULES) {
    const { lessons, ...modRow } = mod;

    const { data: upsertedMod, error: modErr } = await db
      .from('program_modules')
      .upsert({ program_id: PROGRAM_ID, ...modRow }, { onConflict: 'program_id,module_number' })
      .select('id')
      .single();

    if (modErr || !upsertedMod) {
      console.error(`program_modules upsert failed for module ${mod.module_number}:`, modErr?.message);
      process.exit(1);
    }

    const moduleId = upsertedMod.id;

    // Delete existing lessons for this module then re-insert
    await db.from('program_lessons').delete().eq('module_id', moduleId);
    const { error: lErr } = await db.from('program_lessons').insert(
      lessons.map((l) => ({ module_id: moduleId, ...l }))
    );
    if (lErr) {
      console.error(`program_lessons insert failed for module ${mod.module_number}:`, lErr.message);
      process.exit(1);
    }

    console.log(`  ✅ Module ${mod.module_number}: ${mod.title} (${lessons.length} lessons)`);
  }

  console.log('\n✅ HVAC program seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
