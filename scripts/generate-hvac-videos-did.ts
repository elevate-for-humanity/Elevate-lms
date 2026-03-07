/**
 * Generate D-ID talking-head videos for all 94 HVAC lessons.
 *
 * Uses D-ID /clips endpoint with Joseph (lab presenter) — no custom photo needed.
 * Two-step per lesson:
 *   1. Upload MP3 to D-ID /audios → get S3 audio URL
 *   2. POST /clips with presenter_id + audio URL → poll → download MP4
 *
 * Output: public/generated/videos/lesson-{uuid}.mp4
 *
 * Run: npx tsx scripts/generate-hvac-videos-did.ts <did-api-key>
 *
 * Requirements:
 *   - All 94 MP3s in public/generated/lessons/ (run generate-hvac-audio.ts first)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
dotenv.config({ path: '.env', override: false });

import * as fs from 'fs';
import * as path from 'path';
import { HVAC_LESSON_UUID } from '../lib/courses/hvac-uuids';

const DID_API_BASE = 'https://api.d-id.com';

// Accept key as CLI arg
const argKey = process.argv[2];
if (argKey && !argKey.startsWith('--')) process.env.DID_API_KEY = argKey;

const DID_KEY = process.env.DID_API_KEY;

const AUDIO_DIR = path.join(process.cwd(), 'public', 'generated', 'lessons');
const VIDEO_DIR = path.join(process.cwd(), 'public', 'generated', 'videos');

// Joseph in a lab setting — appropriate for trades/HVAC instructor
const PRESENTER_ID = 'v2_public_Joseph_NoHands_OrangeShirt_Lab@hfdqirrsX9';

// Sequential — D-ID clips are slow to process, no benefit to concurrency
const CONCURRENCY = 1;

if (!DID_KEY) {
  console.log('DID_API_KEY not set.');
  console.log('Usage: npx tsx scripts/generate-hvac-videos-did.ts <your-d-id-key>');
  process.exit(0);
}

function authHeader() {
  return `Basic ${DID_KEY}`;
}

/** Upload local MP3 to D-ID /audios, return the S3 URL */
async function uploadAudio(audioPath: string): Promise<string> {
  const filename = path.basename(audioPath);
  const audioBytes = fs.readFileSync(audioPath);
  const form = new FormData();
  form.append('audio', new Blob([audioBytes], { type: 'audio/mpeg' }), filename);

  const res = await fetch(`${DID_API_BASE}/audios`, {
    method: 'POST',
    headers: { Authorization: authHeader(), Accept: 'application/json' },
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`/audios upload ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.url as string;
}

/** Submit a clip job, return clip ID */
async function submitClip(audioUrl: string): Promise<string> {
  const res = await fetch(`${DID_API_BASE}/clips`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      presenter_id: PRESENTER_ID,
      script: { type: 'audio', audio_url: audioUrl },
      config: { result_format: 'mp4' },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`/clips submit ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.id as string;
}

/** Poll until done, return result URL */
async function pollClip(clipId: string, maxWaitMs = 600_000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 8000));
    const res = await fetch(`${DID_API_BASE}/clips/${clipId}`, {
      headers: { Authorization: authHeader(), Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`poll ${res.status}`);
    const data = await res.json();
    if (data.status === 'done') return data.result_url as string;
    if (data.status === 'error') throw new Error(`clip failed: ${data.error?.description ?? 'unknown'}`);
    process.stdout.write('.');
  }
  throw new Error(`timed out after ${maxWaitMs / 1000}s`);
}

async function downloadMp4(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

async function processOne(defId: string, uuid: string): Promise<'skipped' | 'done' | 'failed'> {
  const videoPath = path.join(VIDEO_DIR, `lesson-${uuid}.mp4`);
  if (fs.existsSync(videoPath)) return 'skipped';

  const audioPath = path.join(AUDIO_DIR, `lesson-${uuid}.mp3`);
  if (!fs.existsSync(audioPath)) {
    console.error(`  SKIP ${defId} — no audio (run generate-hvac-audio.ts first)`);
    return 'skipped';
  }

  try {
    process.stdout.write(`  ${defId} upload...`);
    const audioUrl = await uploadAudio(audioPath);

    process.stdout.write(` submit...`);
    const clipId = await submitClip(audioUrl);

    process.stdout.write(` poll`);
    const resultUrl = await pollClip(clipId);

    process.stdout.write(` download...`);
    await downloadMp4(resultUrl, videoPath);

    const sizeMb = (fs.statSync(videoPath).size / 1_048_576).toFixed(1);
    console.log(` done (${sizeMb} MB)`);
    return 'done';
  } catch (e: any) {
    console.error(`\n  FAIL ${defId}: ${e.message}`);
    return 'failed';
  }
}

async function main() {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const all = Object.entries(HVAC_LESSON_UUID) as [string, string][];
  const pending = all.filter(([, uuid]) => !fs.existsSync(path.join(VIDEO_DIR, `lesson-${uuid}.mp4`)));

  if (pending.length === 0) {
    console.log('All HVAC lessons already have video.');
    return;
  }

  console.log(`Generating ${pending.length} D-ID clips (${all.length - pending.length} already done)...`);
  console.log(`Presenter: ${PRESENTER_ID}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  let done = 0, failed = 0, skipped = 0;

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(([defId, uuid]) => processOne(defId, uuid)));
    for (const r of results) {
      if (r === 'done')    done++;
      if (r === 'failed')  failed++;
      if (r === 'skipped') skipped++;
    }
  }

  console.log(`\nDone: ${done} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) { console.log('Re-run to retry failed lessons.'); process.exit(1); }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
