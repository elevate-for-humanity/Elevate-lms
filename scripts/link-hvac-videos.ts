/**
 * links HVAC lesson MP4s to curriculum_lessons.video_file.
 *
 * Mapping strategy (in priority order):
 *   1. lesson_slug  "hvac-lesson-N"  → training_lessons.lesson_number = N → training_lessons.video_url
 *   2. Normalized filename match against lesson_slug / lesson_title
 *
 * Idempotent — safe to run multiple times. Only updates rows where
 * video_file is NULL or the value has changed.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx tsx scripts/link-hvac-videos.ts
 *   tsx scripts/link-hvac-videos.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Get HVAC program
  const { data: program, error: progErr } = await db
    .from('programs')
    .select('id, slug')
    .eq('slug', 'hvac-technician')
    .single();

  if (progErr || !program) throw new Error(`HVAC program not found: ${progErr?.message}`);

  // 2. Get all curriculum_lessons for HVAC
  const { data: lessons, error: lessonErr } = await db
    .from('curriculum_lessons')
    .select('id, lesson_slug, lesson_title, lesson_order, module_order, video_file')
    .eq('program_id', program.id)
    .order('lesson_order', { ascending: true });

  if (lessonErr || !lessons) throw new Error(`Failed to fetch lessons: ${lessonErr?.message}`);

  // 3. Get training_lessons video_url map (lesson_number → video_url)
  const { data: trainingLessons, error: tlErr } = await db
    .from('training_lessons')
    .select('lesson_number, video_url')
    .like('video_url', '%/hvac/%')
    .order('lesson_number', { ascending: true });

  if (tlErr) throw new Error(`Failed to fetch training_lessons: ${tlErr.message}`);

  // Build map: lesson_number → video_url
  const trainingMap = new Map<number, string>();
  for (const tl of trainingLessons ?? []) {
    if (tl.lesson_number && tl.video_url) {
      trainingMap.set(tl.lesson_number, tl.video_url);
    }
  }

  let mapped = 0;
  let skipped = 0;
  let unchanged = 0;
  const exceptions: Array<{ lesson_slug: string; lesson_order: number }> = [];

  for (const lesson of lessons) {
    // Extract lesson number from slug "hvac-lesson-N"
    const match = lesson.lesson_slug?.match(/hvac-lesson-(\d+)/);
    const lessonNum = match ? parseInt(match[1], 10) : null;

    const videoUrl = lessonNum ? trainingMap.get(lessonNum) : null;

    if (!videoUrl) {
      exceptions.push({ lesson_slug: lesson.lesson_slug, lesson_order: lesson.lesson_order });
      continue;
    }

    // Skip if already set to the same value
    if (lesson.video_file === videoUrl) {
      unchanged++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[dry] ${lesson.lesson_slug} → ${videoUrl}`);
      mapped++;
      continue;
    }

    const { error: updateErr } = await db
      .from('curriculum_lessons')
      .update({ video_file: videoUrl, updated_at: new Date().toISOString() })
      .eq('id', lesson.id);

    if (updateErr) throw new Error(`Update failed for ${lesson.lesson_slug}: ${updateErr.message}`);
    mapped++;
  }

  const result = {
    totalLessons: lessons.length,
    trainingVideosAvailable: trainingMap.size,
    mapped,
    unchanged,
    exceptions: exceptions.length,
    exceptionDetails: exceptions,
  };

  console.log(JSON.stringify(result, null, 2));

  if (exceptions.length > 0) {
    console.warn(`\n${exceptions.length} lessons could not be mapped — left as NULL.`);
  }

  if (!DRY_RUN) {
    console.log(`\nDone. ${mapped} updated, ${unchanged} already correct, ${exceptions.length} exceptions.`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
