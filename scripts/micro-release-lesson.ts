#!/usr/bin/env tsx
/**
 * Micro-Release Script — One Lesson at a Time
 *
 * Protocol:
 * 1. Upload video with versioned filename (never overwrite)
 * 2. Verify public URL returns 200/206 with video/mp4 content-type
 * 3. Log old video_url for rollback
 * 4. Swap DB to new URL
 * 5. Hard stop — manual verification required before next lesson
 *
 * Usage:
 *   npx tsx scripts/micro-release-lesson.ts <lesson-def-id>
 *   npx tsx scripts/micro-release-lesson.ts hvac-01-01
 *   npx tsx scripts/micro-release-lesson.ts hvac-01-01 --rollback
 */

import { createClient } from '@supabase/supabase-js';
import { HVAC_LESSON_UUID } from '../lib/courses/hvac-uuids';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET = 'course-videos';
const OUT_DIR = '/tmp/hvac-videos';
const ROLLBACK_LOG = '/tmp/hvac-videos/rollback.json';

// ─── Types ──────────────────────────────────────────────────────

interface RollbackEntry {
  lessonDefId: string;
  uuid: string;
  oldVideoUrl: string | null;
  newVideoUrl: string;
  timestamp: string;
}

// ─── Helpers ────────────────────────────────────────────────────

function loadRollbackLog(): RollbackEntry[] {
  if (!fs.existsSync(ROLLBACK_LOG)) return [];
  return JSON.parse(fs.readFileSync(ROLLBACK_LOG, 'utf8'));
}

function saveRollbackLog(entries: RollbackEntry[]) {
  fs.writeFileSync(ROLLBACK_LOG, JSON.stringify(entries, null, 2));
}

function getVersionedFilename(lessonDefId: string): string {
  const log = loadRollbackLog();
  const existing = log.filter(e => e.lessonDefId === lessonDefId);
  const version = existing.length + 1;
  return `hvac/${lessonDefId}-v${version}.mp4`;
}

async function verifyPublicUrl(url: string): Promise<{ ok: boolean; status: number; contentType: string }> {
  try {
    const resp = await fetch(url, { method: 'HEAD' });
    const contentType = resp.headers.get('content-type') || '';
    return {
      ok: (resp.status === 200 || resp.status === 206) && contentType.includes('video/mp4'),
      status: resp.status,
      contentType,
    };
  } catch (err: any) {
    return { ok: false, status: 0, contentType: err.message };
  }
}

// ─── Upload ─────────────────────────────────────────────────────

async function uploadLesson(lessonDefId: string): Promise<void> {
  const uuid = HVAC_LESSON_UUID[lessonDefId];
  if (!uuid) {
    console.error(`❌ Unknown lesson ID: ${lessonDefId}`);
    console.error(`   Valid IDs look like: hvac-01-01, hvac-02-03, etc.`);
    process.exit(1);
  }

  const localPath = path.join(OUT_DIR, `${uuid}.mp4`);
  if (!fs.existsSync(localPath)) {
    console.error(`❌ Video file not found: ${localPath}`);
    console.error(`   Has generation completed for ${lessonDefId}?`);
    process.exit(1);
  }

  const fileSizeMB = (fs.statSync(localPath).size / 1024 / 1024).toFixed(1);
  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  MICRO-RELEASE: ${lessonDefId}`);
  console.log(`  UUID: ${uuid}`);
  console.log(`  File: ${localPath} (${fileSizeMB} MB)`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  // Step 1: Determine versioned filename
  const storagePath = getVersionedFilename(lessonDefId);
  console.log(`[1/5] Storage path: ${BUCKET}/${storagePath}`);

  // Step 2: Upload to Supabase Storage (never overwrite)
  console.log(`[2/5] Uploading...`);
  const fileBuffer = fs.readFileSync(localPath);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: 'video/mp4',
      upsert: false, // NEVER overwrite
    });

  if (uploadError) {
    console.error(`❌ Upload failed: ${uploadError.message}`);
    if (uploadError.message.includes('already exists')) {
      console.error(`   File already exists at ${storagePath}. This is a safety check — versioned filenames should be unique.`);
    }
    process.exit(1);
  }
  console.log(`   ✅ Uploaded successfully`);

  // Step 3: Get public URL and verify
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;
  console.log(`[3/5] Verifying public URL: ${publicUrl}`);

  // Wait a moment for CDN propagation
  await new Promise(r => setTimeout(r, 2000));

  const verification = await verifyPublicUrl(publicUrl);
  if (!verification.ok) {
    console.error(`❌ Verification FAILED`);
    console.error(`   Status: ${verification.status}`);
    console.error(`   Content-Type: ${verification.contentType}`);
    console.error(`   URL: ${publicUrl}`);
    console.error(`\n   Aborting — no DB changes made. The uploaded file is safe at ${storagePath}.`);
    process.exit(1);
  }
  console.log(`   ✅ Status: ${verification.status}, Content-Type: ${verification.contentType}`);

  // Step 4: Read current video_url (for rollback)
  console.log(`[4/5] Reading current DB state...`);
  const { data: lesson, error: readError } = await supabase
    .from('training_lessons')
    .select('video_url, title')
    .eq('id', uuid)
    .single();

  if (readError) {
    console.error(`❌ DB read failed: ${readError.message}`);
    console.error(`   Uploaded file is safe at ${publicUrl} but DB was NOT updated.`);
    process.exit(1);
  }

  const oldUrl = lesson?.video_url || null;
  console.log(`   Title: ${lesson?.title}`);
  console.log(`   Old URL: ${oldUrl || '(none)'}`);
  console.log(`   New URL: ${publicUrl}`);

  // Save rollback entry BEFORE swapping
  const rollbackEntry: RollbackEntry = {
    lessonDefId,
    uuid,
    oldVideoUrl: oldUrl,
    newVideoUrl: publicUrl,
    timestamp: new Date().toISOString(),
  };
  const log = loadRollbackLog();
  log.push(rollbackEntry);
  saveRollbackLog(log);
  console.log(`   Rollback entry saved to ${ROLLBACK_LOG}`);

  // Step 5: Swap DB to new URL
  console.log(`[5/5] Updating DB...`);
  const { error: updateError } = await supabase
    .from('training_lessons')
    .update({ video_url: publicUrl })
    .eq('id', uuid);

  if (updateError) {
    console.error(`❌ DB update failed: ${updateError.message}`);
    console.error(`   Rollback entry saved. Old URL: ${oldUrl}`);
    process.exit(1);
  }

  console.log(`   ✅ DB updated`);

  // Final verification: re-read DB to confirm
  const { data: confirm } = await supabase
    .from('training_lessons')
    .select('video_url')
    .eq('id', uuid)
    .single();

  if (confirm?.video_url !== publicUrl) {
    console.error(`❌ DB confirmation failed — video_url doesn't match!`);
    console.error(`   Expected: ${publicUrl}`);
    console.error(`   Got: ${confirm?.video_url}`);
    process.exit(1);
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  ✅ RELEASE COMPLETE: ${lessonDefId}`);
  console.log(`  `);
  console.log(`  Video URL: ${publicUrl}`);
  console.log(`  Rollback URL: ${oldUrl || '(none — first upload)'}`);
  console.log(`  `);
  console.log(`  ⚠️  HARD STOP — Manual verification required:`);
  console.log(`  1. Open the LMS lesson page for "${lesson?.title}"`);
  console.log(`  2. Confirm the video plays correctly`);
  console.log(`  3. Only then proceed to the next lesson`);
  console.log(`  `);
  console.log(`  To rollback: npx tsx scripts/micro-release-lesson.ts ${lessonDefId} --rollback`);
  console.log(`═══════════════════════════════════════════════════════\n`);
}

// ─── Rollback ───────────────────────────────────────────────────

async function rollbackLesson(lessonDefId: string): Promise<void> {
  const log = loadRollbackLog();
  const entries = log.filter(e => e.lessonDefId === lessonDefId);

  if (entries.length === 0) {
    console.error(`❌ No rollback entries found for ${lessonDefId}`);
    process.exit(1);
  }

  const latest = entries[entries.length - 1];
  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  ROLLBACK: ${lessonDefId}`);
  console.log(`  UUID: ${latest.uuid}`);
  console.log(`  Reverting to: ${latest.oldVideoUrl || '(null — removing video_url)'}`);
  console.log(`  From: ${latest.newVideoUrl}`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  // Verify old URL still works (if it exists)
  if (latest.oldVideoUrl) {
    const check = await verifyPublicUrl(latest.oldVideoUrl);
    if (!check.ok) {
      console.error(`⚠️  Old URL verification failed (status: ${check.status})`);
      console.error(`   Proceeding anyway — the old URL may have been a placeholder.`);
    } else {
      console.log(`✅ Old URL still accessible`);
    }
  }

  // Swap back
  const { error } = await supabase
    .from('training_lessons')
    .update({ video_url: latest.oldVideoUrl })
    .eq('id', latest.uuid);

  if (error) {
    console.error(`❌ Rollback failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ Rolled back ${lessonDefId} to previous URL`);
  console.log(`   Note: The new file (${latest.newVideoUrl}) is still in storage for reference.\n`);
}

// ─── CLI ────────────────────────────────────────────────────────

async function main() {
  const lessonDefId = process.argv[2];
  const isRollback = process.argv.includes('--rollback');

  if (!lessonDefId) {
    console.log(`Usage:`);
    console.log(`  npx tsx scripts/micro-release-lesson.ts <lesson-def-id>`);
    console.log(`  npx tsx scripts/micro-release-lesson.ts <lesson-def-id> --rollback`);
    console.log(`\nExample:`);
    console.log(`  npx tsx scripts/micro-release-lesson.ts hvac-01-01`);
    console.log(`\nAvailable HVAC lessons:`);
    const ids = Object.keys(HVAC_LESSON_UUID).sort();
    for (const id of ids) {
      const localFile = path.join(OUT_DIR, `${HVAC_LESSON_UUID[id]}.mp4`);
      const ready = fs.existsSync(localFile) ? '✅' : '  ';
      console.log(`  ${ready} ${id}`);
    }
    process.exit(0);
  }

  if (isRollback) {
    await rollbackLesson(lessonDefId);
  } else {
    await uploadLesson(lessonDefId);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
