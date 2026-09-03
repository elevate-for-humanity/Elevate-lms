/**
 * Upload HVAC lesson MP3s to Supabase Storage using the canonical course graph.
 *
 * The uploader intentionally resolves lessons from courses -> course_modules ->
 * course_lessons. It does not depend on the retired HVAC UUID map.
 *
 * Run: npx tsx scripts/upload-hvac-audio-to-storage.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
dotenv.config({ path: '.env', override: false });

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = 'lesson-audio';
const AUDIO_DIR = path.join(process.cwd(), 'public', 'generated', 'lessons');

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Create bucket failed: ${error.message}`);
  }
}

async function getHvacLessons() {
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id,title,slug')
    .or('slug.ilike.%hvac%,title.ilike.%hvac%');
  if (courseError) throw courseError;
  if (!courses?.length) throw new Error('Canonical HVAC course not found');
  if (courses.length > 1) throw new Error(`Expected one canonical HVAC course, found ${courses.length}`);

  const course = courses[0];
  const { data: modules, error: moduleError } = await supabase
    .from('course_modules')
    .select('id')
    .eq('course_id', course.id);
  if (moduleError) throw moduleError;

  const moduleIds = (modules ?? []).map((module) => module.id);
  if (!moduleIds.length) throw new Error(`HVAC course ${course.id} has no canonical modules`);

  const { data: lessons, error: lessonError } = await supabase
    .from('course_lessons')
    .select('id,title')
    .in('module_id', moduleIds)
    .order('id');
  if (lessonError) throw lessonError;
  if (!lessons?.length) throw new Error(`HVAC course ${course.id} has no canonical lessons`);

  return { course, lessons };
}

async function uploadOne(uuid: string, title: string): Promise<'skipped' | 'done' | 'failed'> {
  const localPath = path.join(AUDIO_DIR, `lesson-${uuid}.mp3`);
  const remotePath = `hvac/lesson-${uuid}.mp3`;

  if (!fs.existsSync(localPath)) {
    console.error(`SKIP ${title} (${uuid}) — no local MP3`);
    return 'skipped';
  }

  const fileBytes = fs.readFileSync(localPath);
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list('hvac', { search: `lesson-${uuid}.mp3` });
  if (existing?.length) return 'skipped';

  const { error } = await supabase.storage.from(BUCKET).upload(remotePath, fileBytes, {
    contentType: 'audio/mpeg',
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    console.error(`FAIL ${title} (${uuid}): ${error.message}`);
    return 'failed';
  }

  console.log(`${title} (${uuid}) uploaded (${(fileBytes.length / 1024).toFixed(0)} KB)`);
  return 'done';
}

async function main() {
  await ensureBucket();
  const { course, lessons } = await getHvacLessons();
  console.log(`Canonical HVAC course: ${course.title} (${course.id})`);
  console.log(`Canonical lessons: ${lessons.length}`);

  let done = 0;
  let failed = 0;
  let skipped = 0;
  for (const lesson of lessons) {
    const result = await uploadOne(lesson.id, lesson.title);
    if (result === 'done') done++;
    if (result === 'failed') failed++;
    if (result === 'skipped') skipped++;
  }

  console.log(`Done: ${done} uploaded, ${skipped} skipped, ${failed} failed.`);
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error('Fatal:', error instanceof Error ? error.message : error);
  process.exit(1);
});
