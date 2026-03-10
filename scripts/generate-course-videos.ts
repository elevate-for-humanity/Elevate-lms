/**
 * Generate real course videos using the repo's own tools:
 *   lesson content → GPT-4o scene planning → DALL-E backgrounds → video-generator-v2 → Supabase
 *
 * Usage:
 *   npx tsx scripts/generate-course-videos.ts --course bookkeeping --test    # one test video
 *   npx tsx scripts/generate-course-videos.ts --course hvac --start 1 --end 5
 *   npx tsx scripts/generate-course-videos.ts --course bookkeeping           # all video lessons
 *   npx tsx scripts/generate-course-videos.ts --course all                   # all courses
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import { lessonToScenes, cleanupSceneImages } from '../lib/autopilot/lesson-to-scenes';
import { generateVideo } from '../server/video-generator-v2';
import { getInstructorForCourse } from '../lib/ai-instructors';

const SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const COURSES: Record<string, { id: string; name: string; category: string }> = {
  bookkeeping: {
    id: '2cffc43f-b90f-4c6d-a5d1-1fd2a5e14285',
    name: 'Bookkeeping & QuickBooks Certified User',
    category: 'bookkeeping',
  },
  hvac: {
    id: 'f0593164-55be-5867-98e7-8a86770a8dd0',
    name: 'HVAC Technician',
    category: 'hvac',
  },
  business: {
    id: '8eaf9b1a-7a3a-48d0-b2f0-ee293871a008',
    name: 'Business Startup',
    category: 'business',
  },
};

// Module maps per course
const MODULE_MAPS: Record<string, Record<number, string>> = {
  bookkeeping: Object.fromEntries([
    ...Array.from({length:6}, (_,i) => [i+1, 'Orientation & Bookkeeping Foundations']),
    ...Array.from({length:8}, (_,i) => [i+7, 'QBO Administration']),
    ...Array.from({length:7}, (_,i) => [i+15, 'Sales & Money-In']),
    ...Array.from({length:7}, (_,i) => [i+22, 'Vendors & Money-Out']),
    ...Array.from({length:7}, (_,i) => [i+29, 'Bank Accounts & Transaction Rules']),
    ...Array.from({length:7}, (_,i) => [i+36, 'Basic Reports & Views']),
    ...Array.from({length:6}, (_,i) => [i+43, 'Payroll & Tax Compliance']),
    ...Array.from({length:6}, (_,i) => [i+49, 'MOS Excel Assessment']),
    ...Array.from({length:5}, (_,i) => [i+55, 'Certification Prep']),
    ...Array.from({length:3}, (_,i) => [i+60, 'Career Launch']),
  ]),
  hvac: {},    // Will use generic module names
  business: {},
};

interface LessonRow {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string | null;
  lesson_number: number;
  content_type: string;
}

async function fetchLessons(courseId: string): Promise<LessonRow[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id=eq.${courseId}&order=lesson_number.asc&select=id,title,description,content,video_url,lesson_number,content_type`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) throw new Error(`Fetch failed: ${await res.text()}`);
  return res.json();
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

async function processLesson(
  lesson: LessonRow,
  courseKey: string,
  courseInfo: { id: string; name: string; category: string },
): Promise<{ duration: number; size: number }> {
  const instructor = getInstructorForCourse(courseInfo.name);
  const moduleName = MODULE_MAPS[courseKey]?.[lesson.lesson_number] || `Module`;

  // 1. Convert lesson to scenes
  const { scenes, imagePaths, totalDuration } = await lessonToScenes({
    title: lesson.title,
    content: lesson.content || '',
    description: lesson.description || '',
    lessonNumber: lesson.lesson_number,
    courseName: courseInfo.name,
    courseCategory: courseInfo.category,
    moduleName,
    instructorName: instructor.name,
    instructorTitle: instructor.title,
  });

  // 2. Generate video using video-generator-v2
  const result = await generateVideo({
    title: `${courseInfo.name} - Lesson ${lesson.lesson_number}: ${lesson.title}`,
    scenes,
    settings: {
      format: '16:9',
      resolution: '1080p',
      voiceOver: true,
      backgroundMusic: false,
      voice: instructor.voice as any,
    },
  });

  if (result.status !== 'completed' || !result.videoPath) {
    throw new Error(`Video generation failed: ${result.status}`);
  }

  // 3. Upload to Supabase
  const num = String(lesson.lesson_number).padStart(3, '0');
  const slug = courseInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  const storagePath = `lessons-v3/${slug}-lesson-${num}.mp4`;
  const publicUrl = await uploadVideo(result.videoPath, storagePath);

  // 4. Update DB
  await updateLessonVideoUrl(lesson.id, publicUrl);

  // 5. Get file size
  const stat = await fs.stat(result.videoPath);

  // 6. Cleanup
  await cleanupSceneImages(imagePaths);
  await fs.unlink(result.videoPath).catch(() => {});

  return { duration: totalDuration, size: stat.size };
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
  };
  const isTest = args.includes('--test');
  const courseArg = getArg('course') || 'bookkeeping';
  const startNum = parseInt(getArg('start') || '1');
  const endNum = parseInt(getArg('end') || '999');

  if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }

  const courseKeys = courseArg === 'all' ? Object.keys(COURSES) : [courseArg];

  for (const courseKey of courseKeys) {
    const courseInfo = COURSES[courseKey];
    if (!courseInfo) { console.error(`Unknown course: ${courseKey}`); continue; }

    console.log(`\n=== ${courseInfo.name} ===`);

    const allLessons = await fetchLessons(courseInfo.id);
    const videoLessons = allLessons.filter(l =>
      l.content_type === 'video' &&
      l.lesson_number >= startNum &&
      l.lesson_number <= endNum
    );

    if (isTest) {
      // Only process first video lesson
      videoLessons.splice(1);
    }

    console.log(`Video lessons to process: ${videoLessons.length}`);
    if (isTest) console.log('MODE: TEST (1 lesson only)\n');

    const startTime = Date.now();
    let done = 0;
    let failed = 0;

    for (const lesson of videoLessons) {
      process.stdout.write(`  ${lesson.lesson_number}. ${lesson.title}...`);

      try {
        const r = await processLesson(lesson, courseKey, courseInfo);
        const durMin = (r.duration / 60).toFixed(1);
        const sizeMB = (r.size / 1024 / 1024).toFixed(1);
        console.log(` ✅ ${durMin} min, ${sizeMB} MB`);
        done++;
      } catch (err: any) {
        console.log(` ❌ ${err.message.slice(0, 80)}`);
        failed++;
      }

      const elapsed = (Date.now() - startTime) / 1000 / 60;
      const avg = elapsed / (done + failed);
      const remaining = (videoLessons.length - done - failed) * avg;
      console.log(`    Progress: ${done + failed}/${videoLessons.length} | ${elapsed.toFixed(1)} min elapsed | ~${remaining.toFixed(0)} min remaining`);
    }

    console.log(`\n${courseInfo.name}: ${done} done, ${failed} failed, ${((Date.now() - startTime) / 60000).toFixed(1)} min total`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
