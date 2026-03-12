/**
 * Rebuild HVAC Videos
 *
 * For each of the 95 HVAC lessons:
 *   1. Generate TTS narration from lesson content (OpenAI TTS)
 *   2. Generate a Sora background clip matching the lesson topic
 *   3. Composite: Sora video + TTS audio + text overlay (title + key points)
 *   4. Upload to Supabase storage
 *   5. Update training_lessons.video_url
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/rebuild-hvac-videos.ts
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/rebuild-hvac-videos.ts --start 10 --limit 5
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/rebuild-hvac-videos.ts --dry-run
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
const TEMP_DIR = path.join(process.cwd(), 'temp', 'hvac-rebuild');
const SORA_CONCURRENCY = 5;
const VOICE: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'onyx';
const VOICE_SPEED = 0.95;

// ── Sora scene prompts by module topic ──────────────────────────────────

const MODULE_SCENES: Record<number, string> = {
  1: 'a professional HVAC training orientation classroom with whiteboards showing program schedule, students in work uniforms seated at desks, warm lighting, clean modern facility',
  2: 'a hands-on HVAC workshop with an outdoor condenser unit opened for inspection, tools laid out on a workbench, an instructor pointing at components, bright daylight through garage doors',
  3: 'a close-up of an HVAC electrical panel with a multimeter probing wires, color-coded wiring visible, capacitors and contactors on a workbench, well-lit workshop',
  4: 'a residential furnace with the access panel removed showing the burner assembly, gas valve, and heat exchanger, a technician with a combustion analyzer, warm workshop lighting',
  5: 'a split AC system cutaway showing the refrigeration cycle, refrigerant gauges connected with blue and red hoses, a technician reading pressure values, clean workshop',
  6: 'a classroom setting with EPA 608 study materials on desks, a whiteboard showing refrigerant types and ODP values, students taking notes, professional training environment',
  7: 'a technician recovering refrigerant from a small appliance using a recovery machine, yellow recovery cylinder on a scale, proper PPE worn, well-organized shop',
  8: 'a technician working on a large commercial chiller system with low-pressure gauges, purge unit visible, industrial mechanical room setting, safety equipment visible',
  9: 'a technician brazing copper refrigerant lines with a nitrogen purge setup, manifold gauges connected, recovery machine nearby, professional HVAC shop setting',
  10: 'a technician using a digital manifold to measure superheat and subcooling on a residential AC system, outdoor unit running, temperature clamps on copper lines',
  11: 'a technician performing systematic troubleshooting on a rooftop HVAC unit, checking airflow with an anemometer, tools organized, clear sky background',
  12: 'a technician installing ductwork in a residential attic, measuring static pressure with a manometer, insulated flex duct visible, construction setting',
  13: 'a technician performing a startup checklist on a newly installed HVAC system, clipboard in hand, thermostat on wall, clean residential setting',
  14: 'a mock EPA 608 certification exam setting with test booklets on desks, a proctor at the front, students focused on their exams, quiet professional testing room',
  15: 'a career services office with a resume on screen, an HVAC technician in clean uniform shaking hands with an employer, professional office setting',
  16: 'a graduation ceremony at a training center, students receiving certificates, Elevate for Humanity banner visible, professional and celebratory atmosphere',
};

function getModuleNumber(orderIndex: number): number {
  return Math.floor(orderIndex / 100);
}

function getSoraPrompt(lessonTitle: string, moduleNum: number): string {
  const scene = MODULE_SCENES[moduleNum] || MODULE_SCENES[2];
  return `Professional educational training video scene. ${lessonTitle}. Show ${scene}. Cinematic quality, warm natural lighting, slow steady camera movement. No text overlays or graphics. 16:9 widescreen format.`;
}

// ── Strip HTML to plain text for TTS ────────────────────────────────────

function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<\/?(p|div|h[1-6]|li|tr)[^>]*>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .trim();
}

// ── Generate TTS audio ──────────────────────────────────────────────────

async function generateTTS(text: string, outPath: string): Promise<number> {
  // Truncate to ~2000 chars for reasonable video length (~2 min)
  const truncated = text.length > 2000 ? text.slice(0, 2000) + '.' : text;

  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: VOICE,
    input: truncated,
    speed: VOICE_SPEED,
    response_format: 'mp3',
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outPath, buffer);

  // Get duration via ffprobe
  try {
    const probe = execSync(
      `ffprobe -v quiet -print_format json -show_format "${outPath}"`,
      { encoding: 'utf-8' }
    );
    const dur = JSON.parse(probe).format?.duration;
    return dur ? parseFloat(dur) : estimateDuration(truncated);
  } catch {
    return estimateDuration(truncated);
  }
}

function estimateDuration(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil((words / 150) * 60) + 2; // ~150 wpm + buffer
}

// ── Generate Sora clip ──────────────────────────────────────────────────

async function generateSoraClip(prompt: string, outPath: string): Promise<boolean> {
  try {
    const video = await openai.videos.create({
      model: 'sora-2',
      prompt,
      size: '1280x720',
    });

    const videoId = video.id;

    // Poll for completion (max 3 min)
    for (let i = 0; i < 36; i++) {
      await sleep(5000);
      const status = await openai.videos.retrieve(videoId);

      if (status.status === 'completed') {
        // Download
        const content = await fetch(
          `https://api.openai.com/v1/videos/${videoId}/content`,
          { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
        );
        const buf = Buffer.from(await content.arrayBuffer());
        fs.writeFileSync(outPath, buf);
        return true;
      }

      if (status.status === 'failed') {
        console.error(`  Sora failed: ${(status as any).error?.message || 'unknown'}`);
        return false;
      }
    }

    console.error('  Sora timed out');
    return false;
  } catch (err: any) {
    console.error(`  Sora error: ${err.message}`);
    return false;
  }
}

// ── Composite: Sora video + TTS audio + text overlay ────────────────────

function compositeVideo(
  soraPath: string,
  audioPath: string,
  outputPath: string,
  title: string,
  duration: number,
  lessonNum: number,
  totalLessons: number
): void {
  // Escape special chars for FFmpeg drawtext
  const safeTitle = title
    .replace(/'/g, '')
    .replace(/:/g, ' -')
    .replace(/&/g, 'and')
    .replace(/\\/g, '')
    .slice(0, 60);

  const lessonLabel = `Lesson ${lessonNum} of ${totalLessons}`;

  // Loop the 4s Sora clip to match audio duration, overlay title bar
  const cmd = [
    'ffmpeg -y',
    `-stream_loop -1 -i "${soraPath}"`,
    `-i "${audioPath}"`,
    '-filter_complex',
    `"[0:v]fps=30,scale=1280:720,format=yuv420p,` +
    // Dark gradient bar at bottom
    `drawbox=x=0:y=ih-100:w=iw:h=100:color=black@0.7:t=fill,` +
    // Lesson number
    `drawtext=text='${lessonLabel}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=18:fontcolor=white@0.8:x=30:y=h-85,` +
    // Title
    `drawtext=text='${safeTitle}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=28:fontcolor=white:x=30:y=h-58,` +
    // Elevate branding
    `drawtext=text='Elevate for Humanity':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=16:fontcolor=white@0.6:x=w-250:y=h-85,` +
    // Fade in/out
    `fade=in:0:30,fade=out:st=${Math.max(0, duration - 1)}:d=1[v]"`,
    '-map "[v]" -map 1:a',
    `-t ${duration}`,
    '-c:v libx264 -preset fast -crf 22',
    '-c:a aac -b:a 128k -ar 44100 -ac 2',
    '-movflags +faststart',
    '-shortest',
    `"${outputPath}"`,
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });
}

// ── Fallback: static frame + audio (if Sora fails) ─────────────────────

function compositeStaticVideo(
  audioPath: string,
  outputPath: string,
  title: string,
  duration: number,
  lessonNum: number,
  totalLessons: number,
  accentColor: string
): void {
  const safeTitle = title.replace(/'/g, '').replace(/:/g, ' -').replace(/&/g, 'and').slice(0, 60);
  const lessonLabel = `Lesson ${lessonNum} of ${totalLessons}`;

  const cmd = [
    'ffmpeg -y',
    '-f lavfi -i "color=c=0x1e293b:s=1280x720:d=' + duration + ':r=30"',
    `-i "${audioPath}"`,
    '-filter_complex',
    `"[0:v]format=yuv420p,` +
    `drawtext=text='${lessonLabel}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=22:fontcolor=white@0.6:x=(w-tw)/2:y=h/2-80,` +
    `drawtext=text='${safeTitle}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=36:fontcolor=white:x=(w-tw)/2:y=h/2-30,` +
    `drawtext=text='Elevate for Humanity':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=20:fontcolor=${accentColor}:x=(w-tw)/2:y=h/2+30,` +
    `drawtext=text='HVAC Technician Training':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=18:fontcolor=white@0.5:x=(w-tw)/2:y=h/2+65,` +
    `fade=in:0:30,fade=out:st=${Math.max(0, duration - 1)}:d=1[v]"`,
    '-map "[v]" -map 1:a',
    `-t ${duration}`,
    '-c:v libx264 -preset fast -crf 22',
    '-c:a aac -b:a 128k -ar 44100 -ac 2',
    '-movflags +faststart -shortest',
    `"${outputPath}"`,
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });
}

// ── Upload to Supabase ──────────────────────────────────────────────────

async function uploadVideo(localPath: string, storagePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);

  const { error } = await supabase.storage
    .from('course-videos')
    .upload(storagePath, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('course-videos').getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const ACCENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const startIdx = parseInt(args[args.indexOf('--start') + 1] || '0');
  const limit = parseInt(args[args.indexOf('--limit') + 1] || '999');
  const soraOnly = args.includes('--sora-only');

  console.log('=== Elevate LMS — HVAC Video Rebuild ===\n');

  fs.mkdirSync(TEMP_DIR, { recursive: true });

  // Fetch all HVAC lessons
  const { data: lessons, error } = await supabase
    .from('training_lessons')
    .select('id, title, content, content_type, order_index, lesson_number, video_url')
    .eq('course_id_uuid', HVAC_COURSE_ID)
    .order('order_index');

  if (error || !lessons) {
    console.error('DB error:', error?.message);
    process.exit(1);
  }

  const total = lessons.length;
  console.log(`Total lessons: ${total}`);
  console.log(`Processing: ${startIdx} to ${Math.min(startIdx + limit, total) - 1}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Voice: ${VOICE} @ ${VOICE_SPEED}x`);
  console.log();

  let generated = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  // Process Sora clips in batches for concurrency
  const soraJobs: { lessonIdx: number; prompt: string; outPath: string }[] = [];

  for (let i = startIdx; i < Math.min(startIdx + limit, total); i++) {
    const lesson = lessons[i];
    const num = i + 1;
    const moduleNum = getModuleNumber(lesson.order_index);
    const prefix = `[${num}/${total}]`;
    const lessonDir = path.join(TEMP_DIR, `lesson-${String(num).padStart(3, '0')}`);

    console.log(`${prefix} ${lesson.title} (${lesson.content_type})`);

    if (dryRun) {
      console.log(`  → Would generate: TTS + Sora + composite`);
      skipped++;
      continue;
    }

    fs.mkdirSync(lessonDir, { recursive: true });

    try {
      // 1. Generate TTS from lesson content
      const plainText = htmlToPlain(lesson.content || lesson.title);
      const narrationText = plainText.length > 100
        ? plainText
        : `${lesson.title}. This lesson covers the key concepts and skills needed for HVAC technician certification. Pay attention to the details as this material appears on your EPA 608 exam.`;

      const audioPath = path.join(lessonDir, 'audio.mp3');
      console.log(`  TTS...`);
      const duration = await generateTTS(narrationText, audioPath);
      console.log(`  TTS done: ${duration.toFixed(1)}s`);

      // 2. Generate Sora clip
      const soraPath = path.join(lessonDir, 'sora.mp4');
      const soraPrompt = getSoraPrompt(lesson.title, moduleNum);
      console.log(`  Sora...`);
      const soraOk = await generateSoraClip(soraPrompt, soraPath);

      // 3. Composite
      const outputPath = path.join(lessonDir, 'final.mp4');
      console.log(`  Compositing...`);

      if (soraOk) {
        compositeVideo(soraPath, audioPath, outputPath, lesson.title, duration, num, total);
      } else {
        console.log(`  Sora failed, using static fallback`);
        const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
        compositeStaticVideo(audioPath, outputPath, lesson.title, duration, num, total, color);
      }

      // 4. Upload
      const storagePath = `hvac/hvac-lesson-${String(num).padStart(3, '0')}.mp4`;
      console.log(`  Uploading...`);
      const publicUrl = await uploadVideo(outputPath, storagePath);

      // 5. Update DB
      await supabase
        .from('training_lessons')
        .update({ video_url: publicUrl })
        .eq('id', lesson.id);

      const fileSize = fs.statSync(outputPath).size / 1024 / 1024;
      console.log(`  ✅ ${duration.toFixed(0)}s, ${fileSize.toFixed(1)}MB → ${storagePath}`);
      generated++;

      // Cleanup lesson temp files
      fs.rmSync(lessonDir, { recursive: true, force: true });

    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
      failed++;
      // Cleanup on error too
      try { fs.rmSync(lessonDir, { recursive: true, force: true }); } catch {}
    }
  }

  // Cleanup
  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== COMPLETE ===`);
  console.log(`Generated: ${generated} | Failed: ${failed} | Skipped: ${skipped}`);
  console.log(`Time: ${elapsed} min`);
  console.log(`Course: /programs/hvac-technician/course`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
