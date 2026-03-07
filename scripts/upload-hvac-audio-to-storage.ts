/**
 * Upload all 94 HVAC lesson MP3s to Supabase Storage (public bucket).
 *
 * Creates a public bucket "lesson-audio" if it doesn't exist, then uploads
 * each MP3 as "hvac/lesson-{uuid}.mp3". Files are publicly readable via
 * the Supabase Storage CDN URL — no auth required at runtime.
 *
 * Run: npx tsx scripts/upload-hvac-audio-to-storage.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
dotenv.config({ path: '.env', override: false });

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { HVAC_LESSON_UUID } from '../lib/courses/hvac-uuids';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET     = 'lesson-audio';
const AUDIO_DIR  = path.join(process.cwd(), 'public', 'generated', 'lessons');

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Create bucket failed: ${error.message}`);
    console.log(`Created public bucket: ${BUCKET}`);
  } else {
    console.log(`Bucket exists: ${BUCKET}`);
  }
}

async function uploadOne(defId: string, uuid: string): Promise<'skipped' | 'done' | 'failed'> {
  const localPath  = path.join(AUDIO_DIR, `lesson-${uuid}.mp3`);
  const remotePath = `hvac/lesson-${uuid}.mp3`;

  if (!fs.existsSync(localPath)) {
    console.error(`  SKIP ${defId} — no local MP3`);
    return 'skipped';
  }

  const fileBytes = fs.readFileSync(localPath);

  // Check if already uploaded
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list('hvac', { search: `lesson-${uuid}.mp3` });

  if (existing && existing.length > 0) {
    process.stdout.write(`  skip ${defId} (already uploaded)\n`);
    return 'skipped';
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(remotePath, fileBytes, {
      contentType: 'audio/mpeg',
      cacheControl: '31536000', // 1 year
      upsert: false,
    });

  if (error) {
    console.error(`  FAIL ${defId}: ${error.message}`);
    return 'failed';
  }

  const sizekb = (fileBytes.length / 1024).toFixed(0);
  console.log(`  ${defId} uploaded (${sizekb} KB)`);
  return 'done';
}

async function main() {
  await ensureBucket();

  // Print the public base URL so we can update HvacLessonVideo
  const publicBase = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/hvac`;
  console.log(`\nPublic URL base: ${publicBase}`);
  console.log(`Example: ${publicBase}/lesson-${Object.values(HVAC_LESSON_UUID)[0]}.mp3\n`);

  const all = Object.entries(HVAC_LESSON_UUID) as [string, string][];
  let done = 0, failed = 0, skipped = 0;

  for (const [defId, uuid] of all) {
    const result = await uploadOne(defId, uuid);
    if (result === 'done')    done++;
    if (result === 'failed')  failed++;
    if (result === 'skipped') skipped++;
  }

  console.log(`\nDone: ${done} uploaded, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) { console.log('Re-run to retry failed uploads.'); process.exit(1); }

  console.log(`\nUpdate HvacLessonVideo.tsx AUDIO_BASE_URL to:\n  ${publicBase}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
