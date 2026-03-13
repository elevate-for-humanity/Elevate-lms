/**
 * Generate lesson videos using HeyGen avatar API.
 *
 * Usage:
 *   npx tsx scripts/generate-heygen-video.ts --course hvac --lesson 1
 *   npx tsx scripts/generate-heygen-video.ts --course bookkeeping --lesson 1
 *   npx tsx scripts/generate-heygen-video.ts --course business --lesson 1
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';

const HEYGEN_KEY = process.env.HEYGEN_API_KEY!;
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

// Avatar + voice assignments per course category
const COURSE_AVATARS: Record<string, { avatarId: string; voiceId: string; avatarName: string }> = {
  hvac: {
    avatarId: 'Brandon_Business_Standing_Front_public',
    voiceId: '6be73833ef9a4eb0aeee399b8fe9d62b', // Andrew - natural male
    avatarName: 'Brandon',
  },
  bookkeeping: {
    avatarId: 'Amelia_standing_business_training_front',
    voiceId: '42d00d4aac5441279d8536cd6b52c53c', // Hope - natural female
    avatarName: 'Amelia',
  },
  business: {
    avatarId: 'Byron_Business_Front_public',
    voiceId: '7e157ec62c9c45f1adca12faae72c86f', // Patrick - natural male
    avatarName: 'Byron',
  },
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

async function fetchLesson(courseId: string, lessonNumber: number): Promise<LessonRow> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id=eq.${courseId}&lesson_number=eq.${lessonNumber}&select=id,title,description,content,video_url,lesson_number,content_type`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!res.ok) throw new Error(`Fetch failed: ${await res.text()}`);
  const rows = await res.json();
  if (rows.length === 0) throw new Error(`No lesson found: course=${courseId}, lesson=${lessonNumber}`);
  return rows[0];
}

/**
 * Generate a teaching script from lesson content using GPT-4o.
 * Splits into segments of ~200 words each for multi-scene HeyGen video.
 */
async function generateScript(lesson: LessonRow, courseName: string): Promise<string[]> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const plainContent = lesson.content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.6,
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `You are an instructor for "${courseName}". Write a teaching script for this lesson that an avatar will speak on camera.

LESSON: ${lesson.title}
CONTENT:
${plainContent.slice(0, 5000)}

Requirements:
- Write 3-4 segments separated by "---"
- Total length: 500-700 words (about 3-4 minutes when spoken)
- Segment 1: Introduction — greet students, state what they'll learn
- Segments 2-3: Core teaching — explain key concepts clearly, use examples
- Last segment: Summary — recap key points, preview next lesson
- Conversational but professional tone — like a real instructor in a classroom
- Do NOT include stage directions, just the spoken words
- Do NOT use markdown formatting

Return ONLY the script segments separated by ---`
    }],
  });

  const raw = res.choices[0].message.content || '';
  const segments = raw.split('---').map(s => s.trim()).filter(s => s.length > 20);
  return segments;
}

/**
 * Submit a multi-scene HeyGen video with avatar speaking each segment.
 */
async function submitHeyGenVideo(
  segments: string[],
  avatarConfig: { avatarId: string; voiceId: string },
  title: string,
): Promise<string> {
  const videoInputs = segments.map(segment => ({
    character: {
      type: 'avatar',
      avatar_id: avatarConfig.avatarId,
      avatar_style: 'normal',
    },
    voice: {
      type: 'text',
      input_text: segment,
      voice_id: avatarConfig.voiceId,
      speed: 1.0,
    },
  }));

  const res = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': HEYGEN_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: videoInputs,
      dimension: { width: 1920, height: 1080 },
      test: false,
      title,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`HeyGen submit error: ${JSON.stringify(data.error)}`);
  return data.data.video_id;
}

/**
 * Poll HeyGen until video is ready, return the video URL.
 */
async function waitForVideo(videoId: string, maxWaitMs = 600000): Promise<{ url: string; duration: number }> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      { headers: { 'X-Api-Key': HEYGEN_KEY } },
    );
    const data = await res.json();
    const status = data.data?.status;

    if (status === 'completed') {
      return {
        url: data.data.video_url,
        duration: data.data.duration || 0,
      };
    }
    if (status === 'failed') {
      throw new Error(`HeyGen video failed: ${data.data.error || 'unknown'}`);
    }

    // Still processing — wait 15 seconds
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 15000));
  }
  throw new Error('HeyGen video timed out after 10 minutes');
}

/**
 * Download video from HeyGen URL and upload to Supabase storage.
 */
async function downloadAndUpload(
  heygenUrl: string,
  storagePath: string,
): Promise<string> {
  // Download
  const dlRes = await fetch(heygenUrl);
  if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`);
  const buffer = Buffer.from(await dlRes.arrayBuffer());

  // Upload to Supabase
  const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${storagePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'video/mp4',
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (!upRes.ok) throw new Error(`Upload failed: ${await upRes.text()}`);

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
  if (!res.ok) throw new Error(`DB update failed: ${await res.text()}`);
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
  };

  const courseKey = getArg('course') || 'hvac';
  const lessonNum = parseInt(getArg('lesson') || '1');

  if (!HEYGEN_KEY) { console.error('HEYGEN_API_KEY not set'); process.exit(1); }
  if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1); }
  if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

  const courseInfo = COURSES[courseKey];
  if (!courseInfo) { console.error(`Unknown course: ${courseKey}`); process.exit(1); }

  const avatarConfig = COURSE_AVATARS[courseKey];
  console.log(`\nCourse: ${courseInfo.name}`);
  console.log(`Avatar: ${avatarConfig.avatarName}`);
  console.log(`Lesson: ${lessonNum}\n`);

  // 1. Fetch lesson
  console.log('Fetching lesson from DB...');
  const lesson = await fetchLesson(courseInfo.id, lessonNum);
  console.log(`  "${lesson.title}"`);

  // 2. Generate script
  console.log('Generating teaching script (GPT-4o)...');
  const segments = await generateScript(lesson, courseInfo.name);
  const totalWords = segments.join(' ').split(/\s+/).length;
  console.log(`  ${segments.length} segments, ${totalWords} words (~${Math.round(totalWords / 150)} min)`);

  // 3. Submit to HeyGen
  console.log('Submitting to HeyGen...');
  const videoId = await submitHeyGenVideo(segments, avatarConfig, `${courseInfo.name} - L${lessonNum}: ${lesson.title}`);
  console.log(`  Video ID: ${videoId}`);

  // 4. Wait for rendering
  process.stdout.write('Rendering');
  const { url: heygenUrl, duration } = await waitForVideo(videoId);
  console.log(` done! (${duration}s)`);

  // 5. Download and upload to Supabase
  console.log('Uploading to Supabase...');
  const num = String(lessonNum).padStart(3, '0');
  const slug = courseInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  const storagePath = `lessons-v3/${slug}-lesson-${num}.mp4`;
  const publicUrl = await downloadAndUpload(heygenUrl, storagePath);
  console.log(`  ${publicUrl}`);

  // 6. Update DB
  console.log('Updating database...');
  await updateLessonVideoUrl(lesson.id, publicUrl);

  console.log(`\n✅ Done! ${duration}s video uploaded and wired to lesson.`);
  console.log(`   Watch: ${publicUrl}`);

  // Check remaining credits
  const quotaRes = await fetch('https://api.heygen.com/v2/user/remaining_quota', {
    headers: { 'X-Api-Key': HEYGEN_KEY },
  });
  const quota = await quotaRes.json();
  const remaining = quota.data?.remaining_quota || 0;
  console.log(`   HeyGen credits remaining: ${remaining}s (${Math.round(remaining / 60)} min)`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
