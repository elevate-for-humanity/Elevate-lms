/**
 * Upload course preview MP4s to Supabase Storage (public bucket "course-previews").
 * Run: npx tsx scripts/upload-course-previews-to-storage.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing Supabase credentials'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const BUCKET   = 'course-previews';
const PREV_DIR = path.join(process.cwd(), 'public', 'generated', 'previews');

async function main() {
  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some(b => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Create bucket: ${error.message}`);
    console.log(`Created bucket: ${BUCKET}`);
  }

  const publicBase = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
  console.log(`Public base: ${publicBase}\n`);

  const files = fs.readdirSync(PREV_DIR).filter(f => f.endsWith('.mp4'));
  let done = 0, skipped = 0, failed = 0;

  for (const file of files) {
    const localPath  = path.join(PREV_DIR, file);
    const remotePath = file;

    const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: file });
    if (existing && existing.length > 0) {
      console.log(`  skip ${file} (already uploaded)`);
      skipped++;
      continue;
    }

    const bytes = fs.readFileSync(localPath);
    const { error } = await supabase.storage.from(BUCKET).upload(remotePath, bytes, {
      contentType: 'video/mp4',
      cacheControl: '31536000',
      upsert: false,
    });

    if (error) {
      console.error(`  FAIL ${file}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ${file} → ${publicBase}/${file}`);
      done++;
    }
  }

  console.log(`\nDone: ${done} uploaded, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
