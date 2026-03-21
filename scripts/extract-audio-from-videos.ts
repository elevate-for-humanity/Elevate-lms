/**
 * Extract audio tracks from lesson videos and upload as separate mp3 files.
 * Updates each lesson's audio_url in Supabase.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import { execSync } from 'child_process';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COURSE_ID = '2cffc43f-b90f-4c6d-a5d1-1fd2a5e14285';

interface LessonRow {
  id: string;
  lesson_number: number;
  title: string;
  video_url: string | null;
}

async function fetchVideoLessons(): Promise<LessonRow[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id=eq.${COURSE_ID}&content_type=eq.video&order=lesson_number.asc&select=id,lesson_number,title,video_url`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) throw new Error(`Fetch failed: ${await res.text()}`);
  return res.json();
}

async function uploadAudio(localPath: string, storagePath: string): Promise<string> {
  const buf = await fs.readFile(localPath);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${storagePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath}`;
}

async function updateLesson(lessonId: string, audioUrl: string) {
  // Store audio URL in video_url — the lesson player detects .mp3 and renders audio player
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
      body: JSON.stringify({ video_url: audioUrl }),
    },
  );
  if (!res.ok) throw new Error(`Update failed: ${await res.text()}`);
}

async function main() {
  if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }

  const lessons = await fetchVideoLessons();
  console.log(`Extracting audio from ${lessons.length} video lessons\n`);

  const tmpDir = '/tmp/audio-extract';
  await fs.mkdir(tmpDir, { recursive: true });

  let done = 0;
  let failed = 0;

  for (const lesson of lessons) {
    if (!lesson.video_url) {
      console.log(`  ${lesson.lesson_number}. SKIP (no video): ${lesson.title}`);
      continue;
    }

    const num = String(lesson.lesson_number).padStart(3, '0');
    const localVideo = path.join(tmpDir, `video-${num}.mp4`);
    const localAudio = path.join(tmpDir, `audio-${num}.mp3`);

    try {
      // Download video
      process.stdout.write(`  ${lesson.lesson_number}. ${lesson.title}...`);
      execSync(`curl -s -o "${localVideo}" "${lesson.video_url}"`, { timeout: 60000 });

      // Extract audio
      execSync(`ffmpeg -y -i "${localVideo}" -vn -acodec libmp3lame -ab 128k -ar 44100 "${localAudio}" 2>/dev/null`, { timeout: 30000 });

      const stat = await fs.stat(localAudio);
      const sizeMB = (stat.size / 1024 / 1024).toFixed(1);

      // Upload
      const storagePath = `audio/bookkeeping-quickbooks-lesson-${num}.mp3`;
      const publicUrl = await uploadAudio(localAudio, storagePath);

      // Update video_url to point to audio file
      await updateLesson(lesson.id, publicUrl);

      console.log(` ✅ ${sizeMB} MB`);
      done++;

      // Cleanup
      await fs.unlink(localVideo).catch(() => {});
      await fs.unlink(localAudio).catch(() => {});
    } catch (err: any) {
      console.log(` ❌ ${err.message.slice(0, 60)}`);
      failed++;
    }
  }

  await fs.rm(tmpDir, { recursive: true, force: true });

  console.log(`\nDone: ${done} extracted, ${failed} failed`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
