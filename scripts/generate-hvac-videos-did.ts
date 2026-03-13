/**
 * Generate D-ID talking-head videos for all 94 HVAC lessons.
 *
 * Uses the existing instructor-trades.jpg photo + pre-generated lesson MP3s.
 * D-ID lip-syncs Marcus Johnson's face to each lesson's audio track.
 * Output: public/hvac/videos/lesson-{uuid}.mp4
 *
 * Run: npx tsx scripts/generate-hvac-videos-did.ts
 *
 * Requirements:
 *   - DID_API_KEY in .env.local
 *   - All 94 MP3s already in public/hvac/audio/ (run generate-hvac-audio.ts first)
 *   - Site must be deployed so D-ID can fetch the audio via public URL
 *     OR pass --local to upload audio directly as base64
 *
 * D-ID processes videos asynchronously. This script:
 *   1. Submits all pending lessons to D-ID (up to 5 at a time)
 *   2. Polls until each completes
 *   3. Downloads the MP4 and saves it locally
 *   4. Skips lessons that already have a video
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
dotenv.config({ path: '.env', override: false });

import * as fs from 'fs';
import * as path from 'path';
import { HVAC_LESSON_UUID } from '../lib/courses/hvac-uuids';

const DID_API_BASE = 'https://api.d-id.com';
const DID_KEY = process.env.DID_API_KEY;
const SITE_URL = 'https://www.elevateforhumanity.org';
const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const AUDIO_DIR  = path.join(process.cwd(), 'public', 'hvac', 'audio');
const VIDEO_DIR  = path.join(process.cwd(), 'public', 'hvac', 'videos');
// elizabeth-greene-headshot.jpg: 800x1080 portrait — passes D-ID face detection
const PHOTO_LOCAL = path.join(process.cwd(), 'public', 'images', 'team', 'elizabeth-greene-headshot.jpg');
const PHOTO_URL   = `${SITE_URL}/images/team/elizabeth-greene-headshot.jpg`;
const CONCURRENCY = 3; // D-ID free tier allows ~3 concurrent

if (!DID_KEY) {
  console.log('DID_API_KEY not set — skipping video generation.');
  process.exit(0);
}

function didHeaders() {
  return {
    Authorization: `Basic ${DID_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/** Upload a local file to Supabase Storage and return its public https URL. */
async function uploadToSupabase(localPath: string, storagePath: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/lesson-audio/${storagePath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'audio/mpeg',
        'x-upsert': 'true',
      },
      body: buf,
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload failed: ${err}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/lesson-audio/${storagePath}`;
}

async function submitTalk(audioUrl: string, photoUrl: string = PHOTO_URL): Promise<string> {
  const res = await fetch(`${DID_API_BASE}/talks`, {
    method: 'POST',
    headers: didHeaders(),
    body: JSON.stringify({
      source_url: photoUrl,
      script: { type: 'audio', audio_url: audioUrl },
      config: { stitch: true, result_format: 'mp4' },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`D-ID submit error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.id as string;
}

async function pollTalk(talkId: string, maxWaitMs = 300000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await fetch(`${DID_API_BASE}/talks/${talkId}`, { headers: didHeaders() });
    if (!res.ok) throw new Error(`D-ID poll error ${res.status}`);
    const data = await res.json();
    if (data.status === 'done') return data.result_url as string;
    if (data.status === 'error') throw new Error(`D-ID failed: ${data.error?.description || 'unknown'}`);
  }
  throw new Error(`D-ID timed out after ${maxWaitMs / 1000}s`);
}

async function downloadMp4(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

async function processOne(defId: string, uuid: string): Promise<'skipped' | 'done' | 'failed'> {
  const videoPath = path.join(VIDEO_DIR, `lesson-${uuid}.mp4`);
  if (fs.existsSync(videoPath)) return 'skipped';

  const audioPath = path.join(AUDIO_DIR, `lesson-${uuid}.mp3`);
  if (!fs.existsSync(audioPath)) {
    console.error(`  SKIP ${defId} — no audio file (run generate-hvac-audio.ts first)`);
    return 'skipped';
  }

  const audioUrl = `${SITE_URL}/hvac/audio/lesson-${uuid}.mp3`;

  try {
    const talkId = await submitTalk(audioUrl);
    const resultUrl = await pollTalk(talkId);
    await downloadMp4(resultUrl, videoPath);
    return 'done';
  } catch (e: any) {
    console.error(`  FAIL ${defId}: ${e.message}`);
    return 'failed';
  }
}

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  // Single-lesson mode: --lesson-id hvac-06-09 --audio /path/audio.mp3 --out /path/video.mp4
  const singleLessonId = getArg('--lesson-id');
  const singleAudioPath = getArg('--audio');
  const singleOutPath   = getArg('--out');

  if (singleLessonId) {
    if (!singleAudioPath || !singleOutPath) {
      console.error('--audio and --out are required when --lesson-id is specified');
      process.exit(1);
    }
    if (!fs.existsSync(singleAudioPath)) {
      console.error(`Audio file not found: ${singleAudioPath}`);
      process.exit(1);
    }

    const uuid = HVAC_LESSON_UUID[singleLessonId];
    if (!uuid) {
      console.error(`No UUID found for lesson ${singleLessonId} in HVAC_LESSON_UUID`);
      process.exit(1);
    }

    // Upload instructor photo to Supabase so D-ID can fetch it via https://
    let photoUrl = PHOTO_URL;
    try {
      const photoBuf = fs.readFileSync(PHOTO_LOCAL);
      const photoRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/avatars/hvac-instructor.jpg`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true',
          },
          body: photoBuf,
        }
      );
      if (photoRes.ok) {
        photoUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/hvac-instructor.jpg`;
        console.log(`  Photo URL: ${photoUrl}`);
      }
    } catch { /* fall back to site URL */ }

    // D-ID requires a public https:// URL — upload audio to Supabase Storage first
    const storagePath = `hvac/audio/lesson-${uuid}.mp3`;
    console.log(`Generating video for ${singleLessonId}...`);
    console.log(`  Uploading audio to Supabase Storage...`);
    let audioUrl: string;
    try {
      audioUrl = await uploadToSupabase(singleAudioPath, storagePath);
    } catch (e: any) {
      // Fallback: try production site URL directly (works if already deployed)
      audioUrl = `${SITE_URL}/hvac/audio/lesson-${uuid}.mp3`;
      console.log(`  Upload failed (${e.message}), trying site URL: ${audioUrl}`);
    }
    console.log(`  Audio URL: ${audioUrl}`);
    console.log(`  Out: ${singleOutPath}`);

    try {
      const talkId = await submitTalk(audioUrl, photoUrl);
      const resultUrl = await pollTalk(talkId);
      await downloadMp4(resultUrl, singleOutPath);
      console.log(`Done: ${singleOutPath}`);
    } catch (e: any) {
      console.error(`Failed: ${e.message}`);
      process.exit(1);
    }
    return;
  }

  // Batch mode — all lessons
  const all = Object.entries(HVAC_LESSON_UUID) as [string, string][];
  const pending = all.filter(([, uuid]) => !fs.existsSync(path.join(VIDEO_DIR, `lesson-${uuid}.mp4`)));

  if (pending.length === 0) {
    console.log('All HVAC lessons already have video.');
    return;
  }

  console.log(`Generating ${pending.length} D-ID videos...`);
  console.log(`Photo: ${PHOTO_URL}`);
  console.log(`Audio base URL: ${SITE_URL}/hvac/audio/`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  let done = 0, failed = 0, skipped = 0;

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const labels = batch.map(([id]) => id).join(', ');
    process.stdout.write(`  [${i + 1}-${Math.min(i + CONCURRENCY, pending.length)}/${pending.length}] ${labels} ... `);

    const results = await Promise.all(batch.map(([defId, uuid]) => processOne(defId, uuid)));
    for (const r of results) {
      if (r === 'done')    done++;
      if (r === 'failed')  failed++;
      if (r === 'skipped') skipped++;
    }

    const parts = [];
    if (results.filter(r => r === 'done').length)    parts.push(`${results.filter(r => r === 'done').length} done`);
    if (results.filter(r => r === 'skipped').length) parts.push(`${results.filter(r => r === 'skipped').length} skipped`);
    if (results.filter(r => r === 'failed').length)  parts.push(`${results.filter(r => r === 'failed').length} failed`);
    console.log(parts.join(', '));
  }

  console.log(`\nDone: ${done} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) { console.log('Re-run to retry failed lessons.'); process.exit(1); }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
