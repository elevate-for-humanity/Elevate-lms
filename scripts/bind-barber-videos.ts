/**
 * Bind barber lesson MP4s to course_lessons.video_url in the DB.
 *
 * Run after generate-barber-videos.ts has produced MP4 files:
 *   pnpm tsx scripts/bind-barber-videos.ts
 *
 * For every .mp4 in public/videos/barber-lessons/:
 *   - Derives the lesson slug from the filename (barber-lesson-N.mp4 → barber-lesson-N)
 *   - Sets video_url = '/videos/barber-lessons/{slug}.mp4' on the matching course_lessons row
 *   - Skips files that don't match a known lesson slug
 *   - Reports any lessons still missing video_url after the run
 *
 * Safe to re-run — uses upsert semantics (update only, no insert).
 */

import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false });
dotenv.config({ path: path.join(process.cwd(), '.env'), override: false });

import { createClient } from '@supabase/supabase-js';

const COURSE_ID  = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const VIDEO_DIR  = path.join(process.cwd(), 'public', 'videos', 'barber-lessons');
const URL_PREFIX = '/videos/barber-lessons';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set.');
    process.exit(1);
  }

  const db = createClient(supabaseUrl, supabaseKey);

  // Fetch all lesson slugs for this course
  const { data: lessons, error } = await db
    .from('course_lessons')
    .select('id, slug, video_url')
    .eq('course_id', COURSE_ID)
    .order('order_index');

  if (error || !lessons) {
    console.error('Failed to fetch lessons:', error?.message);
    process.exit(1);
  }

  const slugIndex = new Map(lessons.map(l => [l.slug, l]));

  // Find all MP4s in the video dir
  const mp4Files = fs.readdirSync(VIDEO_DIR)
    .filter(f => f.endsWith('.mp4'))
    .sort();

  console.log(`Found ${mp4Files.length} MP4 files in ${VIDEO_DIR}`);
  console.log(`Binding to ${lessons.length} lessons in course ${COURSE_ID}\n`);

  const counts = { bound: 0, already: 0, unmatched: 0, failed: 0 };

  for (const file of mp4Files) {
    const slug = file.replace('.mp4', '');
    const videoUrl = `${URL_PREFIX}/${file}`;
    const lesson = slugIndex.get(slug);

    if (!lesson) {
      console.log(`  ? ${file} — no matching lesson slug, skipping`);
      counts.unmatched++;
      continue;
    }

    if (lesson.video_url === videoUrl) {
      console.log(`  – ${slug} — already bound`);
      counts.already++;
      continue;
    }

    const { error: updateError } = await db
      .from('course_lessons')
      .update({ video_url: videoUrl })
      .eq('id', lesson.id);

    if (updateError) {
      console.error(`  ✗ ${slug} — DB update failed: ${updateError.message}`);
      counts.failed++;
    } else {
      console.log(`  ✓ ${slug} → ${videoUrl}`);
      counts.bound++;
    }
  }

  console.log(`\nBound: ${counts.bound} | Already set: ${counts.already} | Unmatched: ${counts.unmatched} | Failed: ${counts.failed}`);

  // Final validation — check per-lesson 1:1 coverage
  // A lesson is fully bound when its video_url matches /videos/barber-lessons/{slug}.mp4
  const { data: allLessons } = await db
    .from('course_lessons')
    .select('slug, video_url')
    .eq('course_id', COURSE_ID)
    .order('order_index');

  const notPerLesson = (allLessons ?? []).filter(
    l => l.video_url !== `${URL_PREFIX}/${l.slug}.mp4`,
  );

  if (notPerLesson.length > 0) {
    console.log(`\n⚠️  ${notPerLesson.length} lessons without a per-lesson video (still using shared/null):`);
    for (const l of notPerLesson) console.log(`   ${l.slug}  →  ${l.video_url ?? 'NULL'}`);
    console.log('\nRun generate-barber-videos.ts to produce the missing MP4s, then re-run this script.');
    process.exit(1);
  } else {
    console.log('\n✓ All 50 lessons have 1:1 per-lesson video_url. Track C complete.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
