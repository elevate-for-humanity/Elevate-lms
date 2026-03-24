/**
 * HVAC D-ID Talking Head Video Generator
 *
 * Uses existing MP3s in public/hvac/audio/ + instructor-trades.jpg
 * to generate lip-synced talking head videos via D-ID.
 *
 * Pipeline per lesson:
 *   1. Upload MP3 to Supabase lesson-audio bucket (public URL)
 *   2. Submit talk to D-ID (source photo + audio URL)
 *   3. Poll until complete
 *   4. Download MP4
 *   5. Upload to Supabase course-videos bucket
 *   6. Update course_lessons.video_url
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/generate-hvac-did-videos.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/generate-hvac-did-videos.ts --start 0 --limit 10
 *   npx tsx --env-file=.env.local scripts/generate-hvac-did-videos.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const HVAC_COURSE_ID   = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';
const AUDIO_DIR        = path.join(process.cwd(), 'public/hvac/audio');
const PHOTO_LOCAL      = path.join(process.cwd(), 'public/images/team/elizabeth-greene-headshot.jpg');
const PHOTO_STORAGE    = 'hvac-instructor.jpg'; // uploaded to Supabase avatars bucket
const DID_API          = 'https://api.d-id.com';
const CONCURRENCY      = 3;
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS  = 300000; // 5 min per video

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const DID_KEY   = process.env.DID_API_KEY!;
const SUPA_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function didHeaders() {
  return {
    Authorization: `Basic ${DID_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

// ── Upload MP3 to Supabase lesson-audio bucket ───────────────────────
async function uploadAudio(localPath: string, lessonId: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const storagePath = `hvac/lesson-${lessonId}.mp3`;
  const res = await fetch(`${SUPA_URL}/storage/v1/object/lesson-audio/${storagePath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Audio upload failed: ${err}`);
  }
  return `${SUPA_URL}/storage/v1/object/public/lesson-audio/${storagePath}`;
}

// ── Upload instructor photo to Supabase (once) ───────────────────────
let cachedPhotoUrl: string | null = null;
async function getPhotoUrl(): Promise<string> {
  if (cachedPhotoUrl) return cachedPhotoUrl;
  const buf = fs.readFileSync(PHOTO_LOCAL);
  const res = await fetch(`${SUPA_URL}/storage/v1/object/avatars/${PHOTO_STORAGE}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
    body: buf,
  });
  if (!res.ok) {
    // Try PUT if POST fails
    const res2 = await fetch(`${SUPA_URL}/storage/v1/object/avatars/${PHOTO_STORAGE}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
      body: buf,
    });
    if (!res2.ok) throw new Error(`Photo upload failed: ${await res2.text()}`);
  }
  cachedPhotoUrl = `${SUPA_URL}/storage/v1/object/public/avatars/${PHOTO_STORAGE}`;
  return cachedPhotoUrl;
}

// ── Submit talk to D-ID ──────────────────────────────────────────────
async function submitTalk(audioUrl: string): Promise<string> {
  const photoUrl = await getPhotoUrl();
  const res = await fetch(`${DID_API}/talks`, {
    method: 'POST',
    headers: didHeaders(),
    body: JSON.stringify({
      source_url: photoUrl,
      script: { type: 'audio', audio_url: audioUrl },
      config: {
        stitch: true,
        result_format: 'mp4',
        fluent: true,
        sharpen: true,
        normalization_factor: 1,
        motion_factor: 1,
        align_driver: true,
        align_expand_factor: 0.3,
        show_watermark: false,
      },
    }),
  });
  const d = await res.json() as any;
  if (!res.ok || !d.id) throw new Error(`D-ID submit failed: ${JSON.stringify(d)}`);
  return d.id as string;
}

// ── Poll until done ──────────────────────────────────────────────────
async function pollTalk(talkId: string): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    const res = await fetch(`${DID_API}/talks/${talkId}`, { headers: didHeaders() });
    const d = await res.json() as any;
    if (d.status === 'done') return d.result_url as string;
    if (d.status === 'error') throw new Error(`D-ID error: ${d.error?.description || 'unknown'}`);
  }
  throw new Error(`D-ID timeout after ${POLL_TIMEOUT_MS / 1000}s`);
}

// ── Download MP4 from D-ID result URL ───────────────────────────────
async function downloadVideo(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Upload MP4 to Supabase course-videos bucket ──────────────────────
async function uploadVideo(buf: Buffer, lessonId: string): Promise<string> {
  const storagePath = `hvac/lesson-${lessonId}-did.mp4`;
  const { error } = await supabase.storage
    .from('course-videos')
    .upload(storagePath, buf, { contentType: 'video/mp4', upsert: true });
  if (error) throw new Error(`Video upload failed: ${error.message}`);
  return supabase.storage.from('course-videos').getPublicUrl(storagePath).data.publicUrl;
}

// ── Process one lesson ───────────────────────────────────────────────
async function processLesson(lesson: any, idx: number, total: number): Promise<void> {
  const { id, title } = lesson;
  const audioPath = path.join(AUDIO_DIR, `lesson-${id}.mp3`);

  process.stdout.write(`[${idx}/${total}] ${title.slice(0, 50)}`);

  if (!fs.existsSync(audioPath)) {
    console.log(` — SKIP (no MP3)`);
    return;
  }

  const sizeMB = (fs.statSync(audioPath).size / 1024 / 1024).toFixed(1);
  process.stdout.write(` (${sizeMB}MB)`);

  // 1. Upload audio
  process.stdout.write(' → uploading audio...');
  const audioUrl = await uploadAudio(audioPath, id);

  // 2. Submit to D-ID
  process.stdout.write(' submitting...');
  const talkId = await submitTalk(audioUrl);

  // 3. Poll
  process.stdout.write(' processing...');
  const resultUrl = await pollTalk(talkId);

  // 4. Download
  process.stdout.write(' downloading...');
  const videoBuf = await downloadVideo(resultUrl);
  const videoMB = (videoBuf.length / 1024 / 1024).toFixed(1);

  // 5. Upload to Supabase
  process.stdout.write(` uploading ${videoMB}MB...`);
  const publicUrl = await uploadVideo(videoBuf, id);

  // 6. Update DB
  await supabase
    .from('course_lessons')
    .update({ video_url: publicUrl })
    .eq('id', id);

  console.log(` ✅`);
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun   = args.includes('--dry-run');
  const forceAll = args.includes('--force');
  const startArg = args.indexOf('--start');
  const limitArg = args.indexOf('--limit');
  const startIdx = startArg >= 0 ? parseInt(args[startArg + 1]) : 0;
  const limit    = limitArg >= 0 ? parseInt(args[limitArg + 1]) : 9999;

  console.log('=== HVAC D-ID Video Generator ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'} | Start: ${startIdx} | Limit: ${limit}\n`);

  // Fetch all lesson-type rows
  const { data: lessons, error } = await supabase
    .from('course_lessons')
    .select('id, title, lesson_type, video_url')
    .eq('course_id', HVAC_COURSE_ID)
    .in('lesson_type', ['lesson', 'lab'])
    .order('order_index');

  if (error || !lessons) { console.error('DB error:', error?.message); process.exit(1); }

  // Filter: needs video = no URL or not a D-ID/course-videos URL
  const needsVideo = (l: any) =>
    forceAll || !l.video_url || !l.video_url.includes('/course-videos/');

  const targets = lessons.filter(needsVideo).slice(startIdx, startIdx + limit);

  const hasVideo = lessons.filter((l: any) => !needsVideo(l)).length;
  console.log(`Total lessons: ${lessons.length}`);
  console.log(`Already have video: ${hasVideo}`);
  console.log(`To generate: ${targets.length}`);

  // Check credits
  const credRes = await fetch(`${DID_API}/credits`, { headers: didHeaders() });
  const cred = await credRes.json() as any;
  console.log(`D-ID credits remaining: ${cred.remaining || 'unknown'}\n`);

  if (dryRun) {
    targets.forEach((l: any, i: number) => {
      const audioPath = path.join(AUDIO_DIR, `lesson-${l.id}.mp3`);
      const hasAudio = fs.existsSync(audioPath);
      const sizeMB = hasAudio ? (fs.statSync(audioPath).size / 1024 / 1024).toFixed(1) + 'MB' : 'NO MP3';
      console.log(`  [${i + 1}] ${l.title.slice(0, 60)} — ${sizeMB}`);
    });
    return;
  }

  // Process in batches of CONCURRENCY
  let ok = 0, fail = 0;
  const t0 = Date.now();

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((l: any, j: number) => processLesson(l, i + j + 1, targets.length))
    );
    results.forEach(r => r.status === 'fulfilled' ? ok++ : (fail++, console.error('  ❌', (r as any).reason?.message)));
  }

  const elapsed = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n=== DONE === ${ok} generated | ${fail} failed | ${elapsed} min`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
