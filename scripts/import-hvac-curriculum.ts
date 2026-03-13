/**
 * Import HVAC curriculum from TypeScript data files into curriculum_lessons table.
 *
 * Reads: HVAC_LESSON_CONTENT, HVAC_QUICK_CHECKS, HVAC_RECAPS, HVAC_LESSON_UUID
 * Writes: curriculum_lessons, curriculum_quizzes, curriculum_recaps
 *
 * Run: npx tsx scripts/import-hvac-curriculum.ts
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { HVAC_LESSON_CONTENT } from '../lib/courses/hvac-lesson-content';
import '../lib/courses/hvac-epa608-lessons'; // Side-effect: populates HVAC_LESSON_CONTENT
import { HVAC_QUICK_CHECKS } from '../lib/courses/hvac-quick-checks';
import { HVAC_RECAPS } from '../lib/courses/hvac-recaps';
import { HVAC_LESSON_UUID, HVAC_PROGRAM_ID, HVAC_COURSE_ID } from '../lib/courses/hvac-uuids';
import { HVAC_LESSON_NUMBER_TO_DEF_ID } from '../lib/courses/hvac-lesson-number-map';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

// Module titles derived from the lesson number map comments
const MODULE_TITLES: Record<string, string> = {
  '01': 'Program Orientation',
  '02': 'HVAC Fundamentals & Safety',
  '03': 'Electrical Fundamentals',
  '04': 'Heating Systems',
  '05': 'Refrigeration & Cooling',
  '06': 'EPA 608 Certification',
  '07': 'EPA 608 Type I (Small Appliances)',
  '08': 'EPA 608 Type II (High-Pressure)',
  '09': 'EPA 608 Type III (Low-Pressure)',
  '10': 'Airflow & Duct Systems',
  '11': 'System Installation',
  '12': 'Preventive Maintenance',
  '13': 'Troubleshooting & Diagnostics',
  '14': 'Advanced Systems',
  '15': 'Career Readiness & Employment',
  '16': 'Capstone & Certification Prep',
};

// Reverse map: defId → lessonNumber
const DEF_ID_TO_NUMBER: Record<string, number> = {};
for (const [num, defId] of Object.entries(HVAC_LESSON_NUMBER_TO_DEF_ID)) {
  DEF_ID_TO_NUMBER[defId] = Number(num);
}

// Reverse map: defId → UUID
const DEF_ID_TO_UUID: Record<string, string> = {};
for (const [defId, uuid] of Object.entries(HVAC_LESSON_UUID)) {
  DEF_ID_TO_UUID[defId] = uuid;
}

async function main() {
  console.log('Starting HVAC curriculum import...');
  console.log(`Lessons in HVAC_LESSON_CONTENT: ${Object.keys(HVAC_LESSON_CONTENT).length}`);

  // Ensure HVAC program exists
  const { data: hvacProgram } = await db
    .from('programs')
    .select('id')
    .eq('id', HVAC_PROGRAM_ID)
    .single();

  let programId = hvacProgram?.id;
  if (!programId) {
    // Find by slug
    const { data: bySlug } = await db
      .from('programs')
      .select('id')
      .ilike('slug', '%hvac-technician%')
      .single();
    programId = bySlug?.id;
  }

  if (!programId) {
    console.error('HVAC program not found in programs table');
    process.exit(1);
  }

  console.log(`Using program_id: ${programId}`);

  // Clear existing curriculum_lessons for this program (idempotent re-run)
  await db.from('curriculum_lessons').delete().eq('program_id', programId);

  let lessonsInserted = 0;
  let quizzesInserted = 0;
  let recapsInserted = 0;

  // Process each lesson
  for (const [defId, content] of Object.entries(HVAC_LESSON_CONTENT)) {
    // Parse module from defId (e.g., 'hvac-01-01' → '01', 'epa-core-01' → '16')
    let moduleNum: string;
    let lessonNum: number;

    if (defId.startsWith('epa-')) {
      moduleNum = '16'; // EPA lessons go in module 16
      lessonNum = DEF_ID_TO_NUMBER[defId] || 90;
    } else {
      const parts = defId.split('-');
      moduleNum = parts[1] || '01';
      lessonNum = DEF_ID_TO_NUMBER[defId] || 0;
    }

    const moduleOrder = parseInt(moduleNum, 10);
    const uuid = DEF_ID_TO_UUID[defId];

    // Build lesson title from defId
    const lessonTitle = `Lesson ${lessonNum}: ${content.keyTerms?.[0]?.term || defId}`;

    const lessonRow = {
      id: uuid || undefined, // Use deterministic UUID if available
      program_id: programId,
      course_id: HVAC_COURSE_ID,
      lesson_slug: defId,
      lesson_title: lessonTitle,
      lesson_order: lessonNum,
      module_order: moduleOrder,
      module_title: MODULE_TITLES[moduleNum] || `Module ${moduleOrder}`,
      script_text: content.concept || '',
      key_terms: content.keyTerms || [],
      job_application: content.jobApplication || '',
      watch_for: content.watchFor || [],
      diagram_ref: content.diagramRef || null,
      video_file: uuid ? `/generated/videos/${uuid}.mp4` : null,
      audio_file: uuid ? `/generated/lessons/${uuid}.mp3` : null,
      status: 'published',
    };

    const { data: inserted, error } = await db
      .from('curriculum_lessons')
      .upsert(lessonRow, { onConflict: 'program_id,lesson_slug' })
      .select('id')
      .single();

    if (error) {
      console.error(`Failed to insert ${defId}:`, error.message);
      continue;
    }

    lessonsInserted++;
    const lessonId = inserted.id;

    // Import quizzes for this lesson (keyed by UUID)
    if (uuid && HVAC_QUICK_CHECKS[uuid]) {
      const quizzes = HVAC_QUICK_CHECKS[uuid];
      for (let i = 0; i < quizzes.length; i++) {
        const q = quizzes[i];
        await db.from('curriculum_quizzes').insert({
          lesson_id: lessonId,
          question: q.question,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: q.explanation || '',
          quiz_order: i,
        });
        quizzesInserted++;
      }
    }

    // Import recaps for this lesson (keyed by UUID)
    if (uuid && HVAC_RECAPS[uuid]) {
      const recaps = HVAC_RECAPS[uuid];
      for (let i = 0; i < recaps.length; i++) {
        const r = recaps[i];
        await db.from('curriculum_recaps').insert({
          lesson_id: lessonId,
          title: r.title,
          description: r.description || '',
          recap_order: i,
        });
        recapsInserted++;
      }
    }
  }

  console.log(`\nImport complete:`);
  console.log(`  Lessons: ${lessonsInserted}`);
  console.log(`  Quizzes: ${quizzesInserted}`);
  console.log(`  Recaps:  ${recapsInserted}`);
}

main().catch(console.error);
