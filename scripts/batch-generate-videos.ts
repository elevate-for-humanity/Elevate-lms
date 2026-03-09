/**
 * Batch generate multi-slide lesson videos for all video-type lessons.
 *
 * Uses the calibrated pipeline: script generator → chunked TTS → multi-slide renderer.
 * Skips reading/quiz lessons. Updates video_url in Supabase.
 *
 * Usage:
 *   npx tsx scripts/batch-generate-videos.ts                    # all video lessons
 *   npx tsx scripts/batch-generate-videos.ts --start 7          # start from lesson 7
 *   npx tsx scripts/batch-generate-videos.ts --start 7 --end 14 # lessons 7-14
 *   npx tsx scripts/batch-generate-videos.ts --only 15,16,17    # specific lessons
 *   npx tsx scripts/batch-generate-videos.ts --dry-run           # preview only
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import { generateLessonScript } from '../lib/autopilot/lesson-script-generator';
import { generateTextToSpeech } from '../server/tts-service';
import { renderLessonVideo } from '../server/lesson-video-renderer';

const SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COURSE_ID = '2cffc43f-b90f-4c6d-a5d1-1fd2a5e14285';
const COURSE_NAME = 'Bookkeeping & QuickBooks Certified User';
const INSTRUCTOR_PHOTO = path.join(process.cwd(), 'public/images/team/elizabeth-greene-headshot.jpg');
const VOICE = 'nova';

// Module mapping for all 62 lessons
const MODULE_MAP: Record<number, { moduleNumber: number; moduleName: string }> = {};
// Module 1: Orientation & Bookkeeping Foundations (1-6)
for (let i = 1; i <= 6; i++) MODULE_MAP[i] = { moduleNumber: 1, moduleName: 'Orientation & Bookkeeping Foundations' };
// Module 2: QBO Administration (7-14)
for (let i = 7; i <= 14; i++) MODULE_MAP[i] = { moduleNumber: 2, moduleName: 'QBO Administration' };
// Module 3: Sales & Money-In (15-21)
for (let i = 15; i <= 21; i++) MODULE_MAP[i] = { moduleNumber: 3, moduleName: 'Sales & Money-In' };
// Module 4: Vendors & Money-Out (22-28)
for (let i = 22; i <= 28; i++) MODULE_MAP[i] = { moduleNumber: 4, moduleName: 'Vendors & Money-Out' };
// Module 5: Bank Accounts & Transaction Rules (29-35)
for (let i = 29; i <= 35; i++) MODULE_MAP[i] = { moduleNumber: 5, moduleName: 'Bank Accounts & Transaction Rules' };
// Module 6: Basic Reports & Views (36-42)
for (let i = 36; i <= 42; i++) MODULE_MAP[i] = { moduleNumber: 6, moduleName: 'Basic Reports & Views' };
// Module 7: Payroll & Tax Compliance (43-48)
for (let i = 43; i <= 48; i++) MODULE_MAP[i] = { moduleNumber: 7, moduleName: 'Payroll & Tax Compliance' };
// Module 8: MOS Excel Assessment (49-54)
for (let i = 49; i <= 54; i++) MODULE_MAP[i] = { moduleNumber: 8, moduleName: 'MOS Excel Assessment' };
// Module 9: Certification Prep (55-59)
for (let i = 55; i <= 59; i++) MODULE_MAP[i] = { moduleNumber: 9, moduleName: 'Certification Prep' };
// Module 10: Career Launch (60-62)
for (let i = 60; i <= 62; i++) MODULE_MAP[i] = { moduleNumber: 10, moduleName: 'Career Launch' };

interface LessonRow {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string | null;
  topics: string[];
  lesson_number: number;
  content_type: string;
}

async function fetchAllLessons(): Promise<LessonRow[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id=eq.${COURSE_ID}&order=lesson_number.asc&select=id,title,description,content,video_url,topics,lesson_number,content_type`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) throw new Error(`Fetch failed: ${await res.text()}`);
  return res.json();
}

async function updateLessonVideoUrl(lessonId: string, videoUrl: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?id=eq.${lessonId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ video_url: videoUrl }),
    },
  );
  if (!res.ok) throw new Error(`Update failed: ${await res.text()}`);
}

async function uploadVideo(localPath: string, storagePath: string): Promise<string> {
  const buf = await fs.readFile(localPath);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${storagePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'video/mp4',
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath}`;
}

async function processLesson(
  lesson: LessonRow,
  allLessons: LessonRow[],
  tempDir: string,
): Promise<{ words: number; duration: number; size: number }> {
  const num = lesson.lesson_number;
  const modInfo = MODULE_MAP[num] || { moduleNumber: 1, moduleName: 'Module' };
  const nextLesson = allLessons.find(l => l.lesson_number === num + 1);

  // 1. Generate script
  const script = await generateLessonScript({
    title: lesson.title,
    lessonNumber: num,
    moduleName: modInfo.moduleName,
    moduleNumber: modInfo.moduleNumber,
    description: lesson.description || '',
    content: lesson.content || '',
    topics: lesson.topics || [],
    contentType: lesson.content_type || 'video',
    nextLessonTitle: nextLesson?.title || 'the next topic',
    courseName: COURSE_NAME,
  });

  // 2. Generate TTS
  const audioBuffer = await generateTextToSpeech(script.narration, VOICE, 1.0);
  const audioPath = path.join(tempDir, `lesson-${num}-audio.mp3`);
  await fs.writeFile(audioPath, audioBuffer);

  // 3. Render multi-slide video
  const videoPath = path.join(tempDir, `lesson-${String(num).padStart(3, '0')}.mp4`);
  const result = await renderLessonVideo(
    script.slides,
    audioPath,
    videoPath,
    {
      instructorImagePath: INSTRUCTOR_PHOTO,
      instructorName: 'Elizabeth Greene',
      instructorTitle: 'Founder & Program Director',
      courseName: COURSE_NAME,
      moduleNumber: modInfo.moduleNumber,
      moduleName: modInfo.moduleName,
      lessonNumber: num,
    },
  );

  // 4. Upload
  const storagePath = `lessons-v2/bookkeeping-quickbooks-lesson-${String(num).padStart(3, '0')}.mp4`;
  const publicUrl = await uploadVideo(videoPath, storagePath);

  // 5. Update DB
  await updateLessonVideoUrl(lesson.id, publicUrl);

  // 6. Cleanup temp files for this lesson
  await fs.unlink(audioPath).catch(() => {});
  await fs.unlink(videoPath).catch(() => {});

  return { words: script.wordCount, duration: result.duration, size: result.fileSize };
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
  };
  const dryRun = args.includes('--dry-run');
  const startNum = parseInt(getArg('start') || '1');
  const endNum = parseInt(getArg('end') || '62');
  const onlyStr = getArg('only');
  const onlyNums = onlyStr ? onlyStr.split(',').map(Number) : null;

  if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }

  console.log('=== BATCH VIDEO GENERATION ===');
  console.log(`Course: ${COURSE_NAME}`);
  console.log(`Range: ${onlyNums ? `lessons ${onlyNums.join(',')}` : `lessons ${startNum}-${endNum}`}`);
  if (dryRun) console.log('MODE: DRY RUN');

  const allLessons = await fetchAllLessons();
  const videoLessons = allLessons.filter(l => {
    if (l.content_type !== 'video') return false;
    if (onlyNums) return onlyNums.includes(l.lesson_number);
    return l.lesson_number >= startNum && l.lesson_number <= endNum;
  });

  console.log(`Video lessons to process: ${videoLessons.length}`);
  console.log('');

  if (dryRun) {
    for (const l of videoLessons) {
      console.log(`  ${l.lesson_number}. ${l.title} (${(l.content || '').length} chars)`);
    }
    return;
  }

  const tempDir = path.join(process.cwd(), 'temp', `batch-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  const startTime = Date.now();
  let completed = 0;
  let failed = 0;
  const results: { num: number; title: string; words: number; duration: number; status: string }[] = [];

  for (const lesson of videoLessons) {
    const num = lesson.lesson_number;
    const prefix = `[${num}/${videoLessons[videoLessons.length - 1].lesson_number}]`;
    console.log(`${prefix} ${lesson.title}`);

    try {
      const r = await processLesson(lesson, allLessons, tempDir);
      const durMin = (r.duration / 60).toFixed(1);
      const sizeMB = (r.size / 1024 / 1024).toFixed(1);
      console.log(`  ✅ ${r.words} words, ${durMin} min, ${sizeMB} MB`);
      results.push({ num, title: lesson.title, words: r.words, duration: r.duration, status: 'PASS' });
      completed++;
    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
      results.push({ num, title: lesson.title, words: 0, duration: 0, status: `FAIL: ${err.message.slice(0, 80)}` });
      failed++;
    }

    // Progress
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    const avgPerLesson = elapsed / (completed + failed);
    const remaining = (videoLessons.length - completed - failed) * avgPerLesson;
    console.log(`  Progress: ${completed + failed}/${videoLessons.length} | Elapsed: ${elapsed.toFixed(1)} min | ETA: ${remaining.toFixed(0)} min`);
  }

  // Cleanup
  await fs.rm(tempDir, { recursive: true, force: true });

  // Summary
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('BATCH COMPLETE');
  console.log(`  Total time: ${totalTime} min`);
  console.log(`  Completed: ${completed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Avg duration: ${(results.filter(r => r.duration > 0).reduce((s, r) => s + r.duration, 0) / completed / 60).toFixed(1)} min`);
  console.log(`  Avg words: ${Math.round(results.filter(r => r.words > 0).reduce((s, r) => s + r.words, 0) / completed)}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\nFailed lessons:');
    for (const r of results.filter(r => r.status.startsWith('FAIL'))) {
      console.log(`  ${r.num}. ${r.title}: ${r.status}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
