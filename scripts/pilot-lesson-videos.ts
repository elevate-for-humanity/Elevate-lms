/**
 * Pilot: generate 3 test lesson videos to validate the pipeline.
 *
 * Tests:
 *   - Rich content lesson (3696 chars) — lesson 7
 *   - Medium content lesson (1626 chars) — lesson 1
 *   - Thin content lesson (1471 chars) — lesson 2
 *
 * Validates:
 *   - Script generation (5-segment, ~1000 words)
 *   - Multi-slide rendering (6-8 slides)
 *   - TTS narration
 *   - Final video duration ~6:30-7:00
 *   - Upload to Supabase lessons-v2/ path
 *
 * Run: npx tsx scripts/pilot-lesson-videos.ts
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

// Pilot lesson numbers
const PILOT_LESSONS = [7, 1, 2];

// Module mapping (from course definitions)
const MODULE_MAP: Record<number, { moduleNumber: number; moduleName: string }> = {
  1: { moduleNumber: 1, moduleName: 'Orientation & Bookkeeping Foundations' },
  2: { moduleNumber: 1, moduleName: 'Orientation & Bookkeeping Foundations' },
  3: { moduleNumber: 1, moduleName: 'Orientation & Bookkeeping Foundations' },
  4: { moduleNumber: 1, moduleName: 'Orientation & Bookkeeping Foundations' },
  5: { moduleNumber: 1, moduleName: 'Orientation & Bookkeeping Foundations' },
  6: { moduleNumber: 1, moduleName: 'Orientation & Bookkeeping Foundations' },
  7: { moduleNumber: 2, moduleName: 'QBO Administration' },
  8: { moduleNumber: 2, moduleName: 'QBO Administration' },
  9: { moduleNumber: 2, moduleName: 'QBO Administration' },
  10: { moduleNumber: 2, moduleName: 'QBO Administration' },
  11: { moduleNumber: 2, moduleName: 'QBO Administration' },
  12: { moduleNumber: 2, moduleName: 'QBO Administration' },
  13: { moduleNumber: 2, moduleName: 'QBO Administration' },
};

async function fetchLesson(lessonNumber: number): Promise<any> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id=eq.${COURSE_ID}&lesson_number=eq.${lessonNumber}&select=*`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  return data[0];
}

async function fetchNextLessonTitle(lessonNumber: number): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id=eq.${COURSE_ID}&lesson_number=eq.${lessonNumber + 1}&select=title`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  return data[0]?.title || 'the next topic';
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

async function processLesson(lessonNumber: number, outputDir: string): Promise<void> {
  const lesson = await fetchLesson(lessonNumber);
  if (!lesson) throw new Error(`Lesson ${lessonNumber} not found`);

  const nextTitle = await fetchNextLessonTitle(lessonNumber);
  const modInfo = MODULE_MAP[lessonNumber] || { moduleNumber: 1, moduleName: 'Module' };
  const contentLen = (lesson.content || '').length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`LESSON ${lessonNumber}: ${lesson.title}`);
  console.log(`Content: ${contentLen} chars | Type: ${contentLen > 2000 ? 'RICH' : contentLen > 1000 ? 'MEDIUM' : 'THIN'}`);
  console.log(`${'='.repeat(60)}`);

  // Step 1: Generate structured script
  console.log(`  [1/4] Generating 5-segment script...`);
  const script = await generateLessonScript({
    title: lesson.title,
    lessonNumber,
    moduleName: modInfo.moduleName,
    moduleNumber: modInfo.moduleNumber,
    description: lesson.description || '',
    content: lesson.content || '',
    topics: lesson.topics || [],
    contentType: lesson.content_type || 'video',
    nextLessonTitle: nextTitle,
    courseName: COURSE_NAME,
  });
  console.log(`  Script: ${script.wordCount} words, ~${script.estimatedDuration}s, ${script.slides.length} slides`);
  for (const sl of script.slides) {
    console.log(`    [${sl.segment}] ${sl.title} (${sl.bullets.length} bullets)`);
  }

  // Step 2: Generate TTS
  console.log(`  [2/4] Generating TTS (${VOICE})...`);
  const audioBuffer = await generateTextToSpeech(script.narration, VOICE, 1.0);
  const audioPath = path.join(outputDir, `lesson-${lessonNumber}-audio.mp3`);
  await fs.writeFile(audioPath, audioBuffer);
  console.log(`  Audio: ${(audioBuffer.length / 1024).toFixed(0)} KB`);

  // Step 3: Render multi-slide video
  console.log(`  [3/4] Rendering ${script.slides.length}-slide video...`);
  const videoPath = path.join(outputDir, `lesson-${String(lessonNumber).padStart(3, '0')}.mp4`);
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
      lessonNumber,
    }
  );
  console.log(`  Video: ${(result.fileSize / 1024 / 1024).toFixed(1)} MB, ${result.duration}s (${(result.duration / 60).toFixed(1)} min)`);

  // Step 4: Upload to lessons-v2/
  console.log(`  [4/4] Uploading to Supabase (lessons-v2/)...`);
  const storagePath = `lessons-v2/bookkeeping-quickbooks-lesson-${String(lessonNumber).padStart(3, '0')}.mp4`;
  const publicUrl = await uploadVideo(videoPath, storagePath);
  console.log(`  URL: ${publicUrl}`);

  // Validate
  const durationMin = result.duration / 60;
  const pass = durationMin >= 5.5 && durationMin <= 8.0 && result.fileSize > 500000;
  console.log(`\n  VALIDATION: ${pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    Duration: ${durationMin.toFixed(1)} min (target: 6.5-7.0)`);
  console.log(`    File size: ${(result.fileSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`    Slides: ${script.slides.length} (target: 6-8)`);
  console.log(`    Words: ${script.wordCount} (target: 950-1050)`);
}

async function main() {
  console.log('=== PILOT: 3 Lesson Video Generation ===');
  console.log(`Course: ${COURSE_NAME}`);
  console.log(`Lessons: ${PILOT_LESSONS.join(', ')}`);
  console.log(`Spec: 1920x1080, 30fps, H.264, AAC, ~7 min each`);

  if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }

  const outputDir = path.join(process.cwd(), 'output', 'pilot');
  await fs.mkdir(outputDir, { recursive: true });

  const startTime = Date.now();

  for (const num of PILOT_LESSONS) {
    await processLesson(num, outputDir);
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PILOT COMPLETE: ${elapsed} min`);
  console.log(`Output: ${outputDir}`);
  console.log(`${'='.repeat(60)}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
