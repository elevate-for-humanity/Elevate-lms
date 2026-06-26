#!/usr/bin/env tsx
/**
 * Generates D-ID talking-head videos for the 5 barber lessons
 * that still have local /videos/ paths instead of Supabase URLs.
 *
 * Pipeline per lesson:
 *   1. Build narration script from lesson content
 *   2. Generate TTS MP3 via OpenAI (onyx voice, Brandon Williams persona)
 *   3. Upload MP3 to Supabase lesson-audio bucket → get public URL
 *   4. Submit D-ID talk (instructor photo + audio URL)
 *   5. Poll until complete → download MP4
 *   6. Upload MP4 to Supabase course-videos bucket
 *   7. Update course_lessons.video_url
 *
 * Usage:
 *   pnpm tsx scripts/fix-barber-missing-videos.ts
 *   pnpm tsx scripts/fix-barber-missing-videos.ts --dry-run
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const DID_KEY = process.env.DID_API_KEY!;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

// Instructor photo — Elizabeth Greene (real face, D-ID compatible)
const INSTRUCTOR_PHOTO_URL =
  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/avatars/barber/elizabeth-greene-headshot.webp';

const DID_API = 'https://api.d-id.com';
const POLL_INTERVAL_MS = 6000;
const POLL_TIMEOUT_MS = 300000;

const sb = createClient(SUPA_URL, SUPA_SVC);

function didHeaders() {
  return {
    Authorization: `Basic ${DID_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

// ── Build narration from lesson content ──────────────────────────────
function buildNarration(title: string, content: string): string {
  // Strip markdown, keep first ~800 words for a ~5 min video
  const clean = content
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const intro = `Welcome. Today's lesson is ${title}. Let's get into it.\n\n`;
  const outro = `\n\nThat wraps up ${title}. Complete the quiz and flashcard review before moving on. Great work today.`;
  const maxBody = 4096 - intro.length - outro.length - 10;
  const body = clean.slice(0, maxBody);

  return `${intro}${body}${outro}`;
}

// ── OpenAI TTS ───────────────────────────────────────────────────────
async function generateTTS(text: string, outPath: string): Promise<void> {
  console.log(`  → TTS: ${Math.round(text.length / 5)} words`);
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: text,
      voice: 'onyx',
      instructions: `You are Brandon Williams, a master barber with 12 years of experience teaching at a DOL-registered barbering apprenticeship in Indiana. Speak directly to your apprentices — confident, clear, and practical. Steady professional pace. Natural pauses between paragraphs.`,
      response_format: 'mp3',
      speed: 0.95,
    }),
  });
  if (!res.ok) throw new Error(`TTS failed (${res.status}): ${await res.text()}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
  const size = fs.statSync(outPath).size;
  console.log(`  ✅ TTS: ${(size / 1024).toFixed(0)}KB`);
}

// ── Upload to Supabase storage ───────────────────────────────────────
async function uploadToSupabase(
  localPath: string,
  bucket: string,
  storagePath: string,
  contentType: string,
): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const res = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${storagePath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPA_SVC}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Upload failed (${res.status}): ${txt}`);
  }
  return `${SUPA_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}

// ── D-ID: submit talk ────────────────────────────────────────────────
async function submitDIDTalk(audioUrl: string, photoUrl: string): Promise<string> {
  const body = {
    source_url: photoUrl,
    script: {
      type: 'audio',
      audio_url: audioUrl,
    },
    config: {
      fluent: true,
      pad_audio: 0.0,
      stitch: true,
    },
    presenter_config: {
      crop: { type: 'wide' },
    },
  };

  const res = await fetch(`${DID_API}/talks`, {
    method: 'POST',
    headers: didHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`D-ID submit failed (${res.status}): ${txt}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

// ── D-ID: poll until done ────────────────────────────────────────────
async function pollDIDTalk(talkId: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const res = await fetch(`${DID_API}/talks/${talkId}`, {
      headers: { Authorization: `Basic ${DID_KEY}`, Accept: 'application/json' },
    });
    const data = (await res.json()) as { status: string; result_url?: string; error?: any };
    console.log(`  ⏳ D-ID status: ${data.status}`);
    if (data.status === 'done' && data.result_url) return data.result_url;
    if (data.status === 'error') throw new Error(`D-ID error: ${JSON.stringify(data.error)}`);
  }
  throw new Error('D-ID poll timeout');
}

// ── Download video ───────────────────────────────────────────────────
async function downloadVideo(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
  const size = fs.statSync(outPath).size;
  console.log(`  ✅ Downloaded: ${(size / 1024 / 1024).toFixed(1)}MB`);
}

// ── Resolve instructor photo ──────────────────────────────────────────
async function resolvePhotoUrl(): Promise<string> {
  const res = await fetch(INSTRUCTOR_PHOTO_URL, { method: 'HEAD' });
  if (!res.ok) throw new Error(`Instructor photo not accessible: ${INSTRUCTOR_PHOTO_URL}`);
  console.log(`  📸 Photo: Elizabeth Greene headshot`);
  return INSTRUCTOR_PHOTO_URL;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  if (!OPENAI_KEY) {
    console.error('❌ OPENAI_API_KEY not set');
    process.exit(1);
  }
  if (!DID_KEY) {
    console.error('❌ DID_API_KEY not set');
    process.exit(1);
  }

  // Fetch the 5 broken lessons
  const { data: lessons, error } = await sb
    .from('course_lessons')
    .select('id, title, slug, content, lesson_type')
    .eq('course_id', COURSE_ID)
    .like('video_url', '/videos/%')
    .order('order_index');

  if (error) {
    console.error('DB error:', error.message);
    process.exit(1);
  }
  if (!lessons?.length) {
    console.log('✅ No broken video URLs found — all good!');
    return;
  }

  console.log(`\n═══ Fixing ${lessons.length} barber lessons with broken video URLs ═══\n`);

  const photoUrl = await resolvePhotoUrl();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'barber-fix-'));

  let ok = 0,
    failed = 0;

  for (const lesson of lessons) {
    console.log(`\n[${ok + failed + 1}/${lessons.length}] ${lesson.title}`);

    try {
      const slug = lesson.slug || `lesson-${lesson.id.slice(0, 8)}`;
      const audioPath = path.join(tmpDir, `${slug}.mp3`);
      const videoPath = path.join(tmpDir, `${slug}.mp4`);
      const storageMp3 = `barber/${slug}.mp3`;
      const storageMp4 = `barber/${slug}.mp4`;

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would generate TTS + D-ID for: ${lesson.title}`);
        continue;
      }

      // 1. TTS
      const narration = buildNarration(lesson.title, lesson.content || '');
      await generateTTS(narration, audioPath);

      // 2. Upload audio
      console.log(`  → Uploading audio...`);
      const audioUrl = await uploadToSupabase(audioPath, 'lesson-audio', storageMp3, 'audio/mpeg');
      console.log(`  ✅ Audio: ${audioUrl}`);

      // 3. Submit D-ID
      console.log(`  → Submitting to D-ID...`);
      const talkId = await submitDIDTalk(audioUrl, photoUrl);
      console.log(`  ✅ D-ID talk ID: ${talkId}`);

      // 4. Poll
      const resultUrl = await pollDIDTalk(talkId);
      console.log(`  ✅ D-ID result: ${resultUrl}`);

      // 5. Download
      await downloadVideo(resultUrl, videoPath);

      // 6. Upload video
      console.log(`  → Uploading video to Supabase...`);
      const videoUrl = await uploadToSupabase(videoPath, 'course-videos', storageMp4, 'video/mp4');
      console.log(`  ✅ Video URL: ${videoUrl}`);

      // 7. Update DB
      const { error: updateErr } = await sb
        .from('course_lessons')
        .update({ video_url: videoUrl })
        .eq('id', lesson.id);

      if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);
      console.log(`  ✅ DB updated`);

      // Cleanup tmp files
      fs.unlinkSync(audioPath);
      fs.unlinkSync(videoPath);

      ok++;
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
      failed++;
    }
  }

  fs.rmdirSync(tmpDir, { recursive: true } as any);

  console.log(`\n═══ Done: ${ok} fixed, ${failed} failed ═══\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
