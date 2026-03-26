#!/usr/bin/env node
/**
 * Migrates large media files from public/ to Supabase Storage.
 *
 * Buckets used:
 *   course-videos  — video and audio files
 *   media          — generated images and lesson assets
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/migrate-media-to-storage.mjs
 *
 * Flags:
 *   --dry-run     List files without uploading
 *   --dir=<path>  Only migrate a specific subdirectory (e.g. public/hvac/audio)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const DIR_FLAG = process.argv.find(a => a.startsWith('--dir='))?.split('=')[1];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Map local path prefix → storage bucket + path prefix
const MIGRATION_MAP = [
  { local: 'public/hvac/audio',      bucket: 'course-videos', prefix: 'hvac/audio' },
  { local: 'public/hvac/videos',     bucket: 'course-videos', prefix: 'hvac/videos' },
  { local: 'public/hvac/diagrams',   bucket: 'course-videos', prefix: 'hvac/diagrams' },
  { local: 'public/videos',          bucket: 'course-videos', prefix: 'videos' },
  { local: 'public/videos/lessons',bucket: 'course-videos', prefix: 'videos/lessons' },
  { local: 'public/generated/lessons',bucket: 'media',        prefix: 'generated/lessons' },
];

const MIME_MAP = {
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.vtt': 'text/vtt',
  '.json': 'application/json',
};

function walkDir(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

async function uploadFile(bucket, storagePath, localPath) {
  const ext = extname(localPath).toLowerCase();
  const contentType = MIME_MAP[ext] || 'application/octet-stream';
  const body = readFileSync(localPath);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, body, { contentType, upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);
}

async function main() {
  const targets = DIR_FLAG
    ? MIGRATION_MAP.filter(m => m.local === DIR_FLAG || DIR_FLAG.startsWith(m.local))
    : MIGRATION_MAP;

  let total = 0;
  let uploaded = 0;
  let failed = 0;

  for (const { local, bucket, prefix } of targets) {
    const files = walkDir(local);
    total += files.length;

    console.log(`\n→ ${local} (${files.length} files) → ${bucket}/${prefix}`);

    for (const file of files) {
      const rel = relative(local, file);
      const storagePath = `${prefix}/${rel}`;

      if (DRY_RUN) {
        console.log(`  [dry] ${storagePath}`);
        continue;
      }

      try {
        await uploadFile(bucket, storagePath, file);
        uploaded++;
        if (uploaded % 50 === 0) console.log(`  ${uploaded}/${total} uploaded...`);
      } catch (err) {
        console.error(`  FAIL: ${storagePath} — ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\nDone. ${uploaded} uploaded, ${failed} failed, ${total} total.`);
  if (failed > 0) {
    console.error('Some uploads failed — do not remove files from git until resolved.');
    process.exit(1);
  }

  if (!DRY_RUN) {
    console.log('\nNext steps:');
    console.log('1. Verify files are accessible in Supabase Storage dashboard');
    console.log('2. Run: node scripts/update-media-urls.mjs');
    console.log('3. Test the site locally');
    console.log('4. Then remove files from git: git rm -r public/hvac public/videos');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
