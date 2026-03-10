/**
 * Full Course Pipeline
 *
 * Runs the complete chain:
 *   1. AI Course Builder → generates course structure with GPT-4o
 *   2. Save to Supabase → training_courses + training_lessons
 *   3. Enrich each lesson → GPT-4o generates content, narration, slide text
 *   4. Generate video for each lesson → Canvas composite + TTS + FFmpeg
 *   5. Upload videos to Supabase storage → updates video_url on each lesson
 *
 * Usage:
 *   npx tsx scripts/build-course-pipeline.ts --title "Course Name" --objectives "obj1,obj2,obj3"
 *   npx tsx scripts/build-course-pipeline.ts --course-id "existing-uuid" --videos-only
 *
 * Options:
 *   --title         Course title (required for new courses)
 *   --objectives    Comma-separated objectives (required for new courses)
 *   --course-id     Existing course UUID (skip generation, just enrich + videos)
 *   --videos-only   Only generate videos for lessons that have no video_url
 *   --overwrite     Overwrite existing lessons when rebuilding
 *   --dry-run       Show what would happen without making changes
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import { buildAndSaveCourse, enrichLessonContent } from '../lib/autopilot/ai-course-builder';
import { generateTextToSpeech } from '../server/tts-service';
import { createInstructorCompositeFrame } from '../server/video-renderer';

// Lazy-load native deps
let _ffmpeg: any = null;
async function getFFmpeg() {
  if (_ffmpeg) return _ffmpeg;
  const ff = (await import('fluent-ffmpeg')).default;
  const ffmpegInstaller = (await import('@ffmpeg-installer/ffmpeg')).default;
  const ffprobeInstaller = (await import('@ffprobe-installer/ffprobe')).default;
  ff.setFfmpegPath(ffmpegInstaller.path);
  ff.setFfprobePath(ffprobeInstaller.path);
  _ffmpeg = ff;
  return ff;
}

const SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const INSTRUCTOR_PHOTO = path.join(process.cwd(), 'public/images/team/elizabeth-greene-headshot.jpg');
const INSTRUCTOR_NAME = 'Elizabeth Greene';
const INSTRUCTOR_TITLE = 'Founder & Program Director';
const VOICE = 'nova';
const WIDTH = 1920;
const HEIGHT = 1080;

const ACCENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

interface LessonRow {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string | null;
  topics: string[];
  order_index: number;
  content_type: string;
}

// --- Fetch lessons from Supabase ---
async function fetchLessons(courseId: string): Promise<LessonRow[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id=eq.${courseId}&order=order_index.asc&select=id,title,description,content,video_url,topics,order_index,content_type`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Failed to fetch lessons: ${await res.text()}`);
  return res.json();
}

// --- Update a lesson row ---
async function updateLesson(lessonId: string, data: Record<string, any>) {
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
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error(`Failed to update lesson ${lessonId}: ${await res.text()}`);
}

// --- Generate video for a single lesson ---
async function generateLessonVideo(
  lesson: LessonRow,
  courseTitle: string,
  narration: string,
  slideText: string,
  tempDir: string
): Promise<string> {
  const sceneDir = path.join(tempDir, `lesson-${lesson.order_index}`);
  await fs.mkdir(sceneDir, { recursive: true });

  const accentColor = ACCENT_COLORS[lesson.order_index % ACCENT_COLORS.length];

  // TTS
  const audioBuffer = await generateTextToSpeech(narration, VOICE, 1.0);
  const audioPath = path.join(sceneDir, 'audio.mp3');
  await fs.writeFile(audioPath, audioBuffer);

  // Get audio duration
  const ffmpeg = await getFFmpeg();
  const audioDuration = await new Promise<number>((resolve) => {
    ffmpeg.ffprobe(audioPath, (err: any, metadata: any) => {
      if (err || !metadata?.format?.duration) {
        resolve(Math.ceil((narration.split(/\s+/).length / 150) * 60) + 2);
      } else {
        resolve(Math.ceil(metadata.format.duration) + 1);
      }
    });
  });

  // Composite frame
  const frameBuffer = await createInstructorCompositeFrame(
    slideText,
    WIDTH, HEIGHT,
    {
      instructorImagePath: INSTRUCTOR_PHOTO,
      instructorName: INSTRUCTOR_NAME,
      instructorTitle: INSTRUCTOR_TITLE,
      slideTitle: lesson.title,
      accentColor,
      fontSize: 54,
      titleFontSize: 72,
    }
  );
  const framePath = path.join(sceneDir, 'frame.png');
  await fs.writeFile(framePath, frameBuffer);

  // Render video
  const videoPath = path.join(sceneDir, 'lesson.mp4');
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(framePath)
      .inputOptions(['-loop', '1'])
      .input(audioPath)
      .outputOptions([
        '-map', '0:v', '-map', '1:a',
        '-c:v', 'libx264', '-crf', '20', '-preset', 'fast',
        '-r', '30', '-t', audioDuration.toString(),
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '128k',
        '-shortest', '-movflags', '+faststart',
      ])
      .output(videoPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });

  return videoPath;
}

// --- Upload video to Supabase ---
async function uploadVideo(localPath: string, storagePath: string): Promise<string> {
  const videoBuffer = await fs.readFile(localPath);
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/media/${storagePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'video/mp4',
        'x-upsert': 'true',
      },
      body: videoBuffer,
    }
  );
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath}`;
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
  };
  const hasFlag = (name: string) => args.includes(`--${name}`);

  const title = getArg('title');
  const objectives = getArg('objectives')?.split(',').map(s => s.trim()) || [];
  let courseId = getArg('course-id');
  const videosOnly = hasFlag('videos-only');
  const overwrite = hasFlag('overwrite');
  const dryRun = hasFlag('dry-run');
  const limit = getArg('limit') ? parseInt(getArg('limit')!) : Infinity;

  if (!courseId && !title) {
    console.error('Usage: npx tsx scripts/build-course-pipeline.ts --title "Course Name" --objectives "obj1,obj2"');
    console.error('   or: npx tsx scripts/build-course-pipeline.ts --course-id "uuid" --videos-only');
    process.exit(1);
  }

  if (!SUPABASE_KEY) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY not set');
    process.exit(1);
  }

  const startTime = Date.now();

  // Step 1: Build course (if no existing course ID)
  if (!courseId && title) {
    if (dryRun) {
      console.log(`[dry-run] Would generate course: "${title}" with objectives: ${objectives.join(', ')}`);
      process.exit(0);
    }
    const result = await buildAndSaveCourse({
      title,
      objectives,
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_KEY,
      overwrite,
    });
    courseId = result.courseId;
    console.log(`\n[pipeline] Course created: ${courseId} (${result.lessonCount} lessons)\n`);
  }

  // Step 2: Fetch all lessons
  const lessons = await fetchLessons(courseId!);
  console.log(`[pipeline] ${lessons.length} lessons in course ${courseId}`);

  // Fetch course title
  const courseRes = await fetch(
    `${SUPABASE_URL}/rest/v1/training_courses?id=eq.${courseId}&select=course_name`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const courseData = await courseRes.json();
  const courseTitle = courseData[0]?.course_name || 'Course';

  // Step 3: Enrich + generate videos
  const tempDir = path.join(process.cwd(), 'temp', `pipeline-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  let videosGenerated = 0;
  let lessonsEnriched = 0;

  for (const lesson of lessons) {
    const lessonNum = lesson.order_index + 1;
    const prefix = `[${lessonNum}/${lessons.length}]`;

    // Skip non-video lessons
    if (lesson.content_type === 'quiz' || lesson.content_type === 'reading') {
      console.log(`${prefix} Skip (${lesson.content_type}): ${lesson.title}`);
      continue;
    }

    // Skip if already has video and videos-only mode
    if (videosOnly && lesson.video_url) {
      console.log(`${prefix} Skip (has video): ${lesson.title}`);
      continue;
    }

    if (dryRun) {
      console.log(`${prefix} Would enrich + generate video: ${lesson.title}`);
      continue;
    }

    // Check limit
    if (videosGenerated >= limit) {
      console.log(`${prefix} Limit reached (${limit})`);
      break;
    }

    // Enrich lesson content
    console.log(`${prefix} Enriching: ${lesson.title}`);
    try {
      const enriched = await enrichLessonContent(
        { title: lesson.title, description: lesson.description || '', topics: lesson.topics || [] },
        courseTitle
      );

      // Update lesson content in Supabase
      await updateLesson(lesson.id, { content: enriched.content });
      lessonsEnriched++;

      // Generate video
      console.log(`${prefix} Generating video...`);
      const videoPath = await generateLessonVideo(lesson, courseTitle, enriched.narration, enriched.slideText, tempDir);

      // Upload
      const slug = courseData[0]?.course_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'course';
      const storagePath = `lessons/${slug}-lesson-${String(lessonNum).padStart(3, '0')}.mp4`;
      const publicUrl = await uploadVideo(videoPath, storagePath);

      // Update lesson with video URL
      await updateLesson(lesson.id, { video_url: publicUrl });
      videosGenerated++;
      console.log(`${prefix} ✅ ${lesson.title}`);

    } catch (err: any) {
      console.error(`${prefix} ❌ Failed: ${lesson.title} — ${err.message}`);
    }
  }

  // Cleanup
  await fs.rm(tempDir, { recursive: true, force: true });

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n[pipeline] Done in ${elapsed} min`);
  console.log(`[pipeline] Lessons enriched: ${lessonsEnriched}`);
  console.log(`[pipeline] Videos generated: ${videosGenerated}`);
  console.log(`[pipeline] Course ID: ${courseId}`);
  console.log(`[pipeline] LMS URL: /lms/courses/${courseId}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
