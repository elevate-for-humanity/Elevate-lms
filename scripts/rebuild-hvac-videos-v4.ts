/**
 * Rebuild HVAC Videos V4 — Reference Quality, Synced Segments
 *
 * Each lesson = 10 synced segments. Each segment:
 *   - Has its own narration chunk (TTS)
 *   - Has its own Sora clip that matches what's being said
 *   - The clip stays on screen for the full narration duration (no premature cuts)
 *   - Component label + definition overlaid on the footage
 *   - Whisper captions burned in
 *
 * Flow per lesson:
 *   1. GPT-4o plans 10 segments: each with narration text + Sora prompt + label
 *   2. Generate 10 TTS audio files (one per segment)
 *   3. Generate 10 Sora clips in parallel
 *   4. For each segment: loop Sora clip to match its narration duration, add label overlay
 *   5. Concatenate all 10 segment videos
 *   6. Merge full audio, generate Whisper captions, burn in captions + branding
 *   7. Upload to Supabase, update DB
 *
 * Result: clip changes ONLY when the topic changes. No desync.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/rebuild-hvac-videos-v4.ts --start 0 --limit 1
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
const TEMP_DIR = path.join(process.cwd(), 'temp', 'hvac-v4');
const SEGMENTS = 10;
const SORA_BATCH = 5;
const VOICE: 'onyx' = 'onyx';
const W = 1280;
const H = 720;
const FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

interface Segment {
  narration: string;
  soraPrompt: string;
  label: string;
  definition: string;
}

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<\/?(p|div|h[1-6]|li|tr|ul|ol|table|thead|tbody|blockquote|section|article|header|footer|nav|aside|figure|figcaption|details|summary|main)[^>]*>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
}

function esc(s: string): string {
  return s.replace(/'/g, '').replace(/:/g, ' -').replace(/&/g, 'and')
    .replace(/\\/g, '').replace(/"/g, '').replace(/\[/g, '(')
    .replace(/\]/g, ')').replace(/%/g, ' pct').replace(/;/g, ',');
}

function probeDuration(filePath: string): number {
  try {
    const p = execSync(`ffprobe -v quiet -print_format json -show_format "${filePath}"`, { encoding: 'utf-8' });
    return parseFloat(JSON.parse(p).format?.duration || '10');
  } catch { return 10; }
}

// ── GPT-4o: Plan 10 synced segments ─────────────────────────────────────

async function planSegments(title: string, content: string, lessonNum: number): Promise<Segment[]> {
  const plain = htmlToPlain(content).slice(0, 5000);

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.4,
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `You are the narrator for Elevate for Humanity's HVAC Technician Training Program (EPA 608 certification).

LESSON ${lessonNum}: ${title}

CONTENT:
${plain}

Plan exactly 10 video segments. Each segment is ONE topic — the narrator talks about it while a matching video clip plays on screen. The clip stays visible for the ENTIRE narration of that segment. When the narrator moves to the next topic, the clip changes.

Segment 1: Hook/introduction — what this lesson covers and why it matters
Segments 2-9: Core content — one concept per segment, building logically
Segment 10: Summary — key takeaways, what to remember for the EPA 608 exam

For each segment:
- narration: 35-50 words. Professional instructor tone. Speak naturally and slowly — this is educational content for workforce training students. No brackets or stage directions. Each segment should flow naturally from the previous one.
- soraPrompt: Exactly what the viewer sees during this narration. Be VERY specific: what equipment, what the technician is doing, what tools are visible, what angle. The video MUST match what the narrator is describing. Include "professional HVAC technician" or "HVAC training workshop". No text in the video.
- label: Component or concept name shown on screen (2-5 words, e.g., "Compressor", "Manifold Gauge Set")
- definition: One-line definition (8-15 words, e.g., "Pumps refrigerant through the system under high pressure")

Return JSON array only — no markdown, no explanation:
[{"narration":"...","soraPrompt":"...","label":"...","definition":"..."}]`
    }],
  });

  const raw = res.choices[0].message.content || '';
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned) as Segment[];
}

// ── TTS per segment ─────────────────────────────────────────────────────

async function generateTTS(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd', voice: VOICE, input: text.slice(0, 4096), speed: 0.90,
    response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  return probeDuration(outPath);
}

// ── Sora clips (parallel batches) ───────────────────────────────────────

async function generateSoraClip(prompt: string): Promise<string | null> {
  try {
    const video = await openai.videos.create({ model: 'sora-2', prompt, size: '1280x720' });
    for (let i = 0; i < 40; i++) {
      await sleep(5000);
      const s = await openai.videos.retrieve(video.id);
      if (s.status === 'completed') return video.id;
      if (s.status === 'failed') return null;
    }
    return null;
  } catch { return null; }
}

async function downloadClip(videoId: string, outPath: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    if (!resp.ok) return false;
    fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
    return true;
  } catch { return false; }
}

async function generateAllSoraClips(segments: Segment[], dir: string): Promise<string[]> {
  const paths: string[] = [];
  for (let b = 0; b < segments.length; b += SORA_BATCH) {
    const batch = segments.slice(b, b + SORA_BATCH);
    const ids = await Promise.all(batch.map(s => generateSoraClip(s.soraPrompt)));
    for (let i = 0; i < ids.length; i++) {
      const idx = b + i;
      const clipPath = path.join(dir, `sora-${String(idx).padStart(2, '0')}.mp4`);
      if (ids[i]) {
        const ok = await downloadClip(ids[i]!, clipPath);
        if (ok) { paths.push(clipPath); continue; }
      }
      // Fallback dark frame
      execSync(
        `ffmpeg -y -f lavfi -i "color=c=0x1e293b:s=${W}x${H}:d=4:r=30" ` +
        `-vf "format=yuv420p" -c:v libx264 -preset fast -crf 23 -an "${clipPath}"`,
        { stdio: 'pipe' }
      );
      paths.push(clipPath);
    }
  }
  return paths;
}

// ── Build segment video: Sora clip looped to match narration duration ───

function buildSegmentVideo(
  soraClipPath: string, audioPath: string, outputPath: string,
  label: string, definition: string, audioDuration: number
): void {
  const safeLabel = esc(label).slice(0, 35);
  const safeDef = esc(definition).slice(0, 65);

  const vf = [
    `fps=30`,
    `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black`,
    `format=yuv420p`,
    // Label bar above caption zone
    `drawbox=x=0:y=ih-140:w=iw:h=58:color=black@0.65:t=fill`,
    `drawtext=text='${safeLabel}':fontfile=${FB}:fontsize=26:fontcolor=white:x=30:y=h-135`,
    `drawtext=text='${safeDef}':fontfile=${FR}:fontsize=17:fontcolor=white@0.85:x=30:y=h-108`,
    // Fade at segment boundaries
    `fade=in:0:12`,
    `fade=out:st=${Math.max(0, audioDuration - 0.4)}:d=0.4`,
  ].join(',');

  execSync(
    `ffmpeg -y -stream_loop -1 -i "${soraClipPath}" -i "${audioPath}" ` +
    `-vf "${vf}" ` +
    `-map 0:v -map 1:a ` +
    `-t ${audioDuration} ` +
    `-c:v libx264 -preset fast -crf 23 ` +
    `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
    `-movflags +faststart -shortest "${outputPath}"`,
    { stdio: 'pipe' }
  );
}

// ── Whisper captions ────────────────────────────────────────────────────

async function generateCaptions(audioPath: string, srtPath: string): Promise<void> {
  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: fs.createReadStream(audioPath) as any,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  const segments = (transcription as any).segments || [];
  let srt = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const words = seg.text.trim().split(/\s+/);
    if (words.length <= 10) {
      srt += `${i + 1}\n${fmtSRT(seg.start)} --> ${fmtSRT(seg.end)}\n${seg.text.trim()}\n\n`;
    } else {
      const mid = Math.ceil(words.length / 2);
      srt += `${i + 1}\n${fmtSRT(seg.start)} --> ${fmtSRT(seg.end)}\n${words.slice(0, mid).join(' ')}\n${words.slice(mid).join(' ')}\n\n`;
    }
  }
  if (!srt) srt = `1\n00:00:00,000 --> 00:05:00,000\n[Narration]\n\n`;
  fs.writeFileSync(srtPath, srt);
}

function fmtSRT(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

// ── Final assembly ──────────────────────────────────────────────────────

function assembleFinal(
  segmentVideos: string[], fullAudioPath: string, srtPath: string,
  outputPath: string, totalDuration: number,
  lessonNum: number, total: number, lessonTitle: string
): void {
  const dir = path.dirname(outputPath);

  const concatFile = path.join(dir, 'concat.txt');
  fs.writeFileSync(concatFile, segmentVideos.map(p => `file '${p}'`).join('\n'));

  const rawConcat = path.join(dir, 'raw-concat.mp4');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${rawConcat}"`,
    { stdio: 'pipe' }
  );

  const safeTitle = esc(lessonTitle).slice(0, 50);
  const label = `Lesson ${lessonNum} of ${total}`;
  const safeSrt = srtPath.replace(/'/g, "'\\''").replace(/:/g, '\\:');

  execSync(
    `ffmpeg -y -i "${rawConcat}" ` +
    `-vf "` +
    `drawbox=x=0:y=ih-45:w=iw:h=45:color=0x0f172a@0.9:t=fill,` +
    `drawtext=text='${label}':fontfile=${FR}:fontsize=13:fontcolor=white@0.6:x=20:y=h-32,` +
    `drawtext=text='${safeTitle}':fontfile=${FB}:fontsize=15:fontcolor=white@0.8:x=180:y=h-32,` +
    `drawtext=text='Elevate for Humanity':fontfile=${FR}:fontsize=12:fontcolor=white@0.4:x=w-185:y=h-32,` +
    `subtitles='${safeSrt}':force_style='FontName=DejaVu Sans\\,FontSize=19\\,PrimaryColour=&HFFFFFF\\,OutlineColour=&H000000\\,Outline=2\\,Shadow=1\\,MarginV=55\\,Alignment=2'" ` +
    `-c:v libx264 -preset fast -crf 22 -c:a copy ` +
    `-movflags +faststart "${outputPath}"`,
    { stdio: 'pipe' }
  );

  try { fs.unlinkSync(concatFile); } catch {}
  try { fs.unlinkSync(rawConcat); } catch {}
}

// ── Upload ──────────────────────────────────────────────────────────────

async function uploadVideo(localPath: string, storagePath: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const { error } = await supabase.storage.from('course-videos')
    .upload(storagePath, buf, { contentType: 'video/mp4', upsert: true });
  if (error) throw new Error(`Upload: ${error.message}`);
  return supabase.storage.from('course-videos').getPublicUrl(storagePath).data.publicUrl;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const startIdx = parseInt(args[args.indexOf('--start') + 1] || '0');
  const limit = parseInt(args[args.indexOf('--limit') + 1] || '999');

  console.log('=== HVAC Video V4 — Synced Segments ===');
  console.log('Each clip stays on screen while narrator explains it. No desync.\n');
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const { data: lessons, error } = await supabase
    .from('training_lessons')
    .select('id, title, content, content_type, order_index, lesson_number')
    .eq('course_id_uuid', HVAC_COURSE_ID)
    .order('order_index');

  if (error || !lessons) { console.error('DB:', error?.message); process.exit(1); }

  const total = lessons.length;
  const end = Math.min(startIdx + limit, total);
  const count = end - startIdx;

  console.log(`Lessons: ${total} | Processing: ${startIdx}-${end - 1} (${count})`);
  console.log(`Est cost: ~$${(count * 1.35).toFixed(0)} | Est time: ~${(count * 5).toFixed(0)} min`);
  if (dryRun) { console.log('\nDRY RUN'); return; }
  console.log();

  let ok = 0, fail = 0;
  const t0 = Date.now();

  for (let i = startIdx; i < end; i++) {
    const lesson = lessons[i];
    const num = i + 1;
    const dir = path.join(TEMP_DIR, `L${String(num).padStart(3, '0')}`);
    fs.mkdirSync(dir, { recursive: true });

    console.log(`[${num}/${total}] ${lesson.title}`);

    try {
      // 1. Plan
      process.stdout.write('  Plan...');
      const segments = await planSegments(lesson.title, lesson.content || '', num);
      const wordCount = segments.reduce((s, seg) => s + seg.narration.split(/\s+/).length, 0);
      console.log(` ${segments.length} segments, ${wordCount} words`);

      // 2. TTS per segment
      process.stdout.write('  TTS...');
      const audioPaths: string[] = [];
      const durations: number[] = [];
      for (let s = 0; s < segments.length; s++) {
        const ap = path.join(dir, `audio-${String(s).padStart(2, '0')}.mp3`);
        const dur = await generateTTS(segments[s].narration, ap);
        audioPaths.push(ap);
        durations.push(dur);
      }
      const totalDur = durations.reduce((a, b) => a + b, 0);
      console.log(` ${totalDur.toFixed(0)}s (${(totalDur / 60).toFixed(1)} min)`);

      // 3. Sora clips
      process.stdout.write(`  Sora (${segments.length})...`);
      const soraClips = await generateAllSoraClips(segments, dir);
      const soraOk = soraClips.filter(p => {
        try { return fs.statSync(p).size > 50000; } catch { return false; }
      }).length;
      console.log(` ${soraOk}/${segments.length} ok`);

      // 4. Build segment videos
      process.stdout.write('  Segments...');
      const segmentVideos: string[] = [];
      for (let s = 0; s < segments.length; s++) {
        const segPath = path.join(dir, `seg-${String(s).padStart(2, '0')}.mp4`);
        buildSegmentVideo(
          soraClips[s], audioPaths[s], segPath,
          segments[s].label, segments[s].definition, durations[s]
        );
        segmentVideos.push(segPath);
      }
      console.log(` ${segmentVideos.length} built`);

      // 5. Full audio for Whisper
      const fullAudioPath = path.join(dir, 'full-audio.mp3');
      const audioConcat = path.join(dir, 'audio-concat.txt');
      fs.writeFileSync(audioConcat, audioPaths.map(p => `file '${p}'`).join('\n'));
      execSync(`ffmpeg -y -f concat -safe 0 -i "${audioConcat}" -c copy "${fullAudioPath}"`, { stdio: 'pipe' });

      // 6. Captions
      process.stdout.write('  Captions...');
      const srtPath = path.join(dir, 'captions.srt');
      await generateCaptions(fullAudioPath, srtPath);
      console.log(' done');

      // 7. Final assembly
      const finalPath = path.join(dir, 'final.mp4');
      process.stdout.write('  Final...');
      assembleFinal(segmentVideos, fullAudioPath, srtPath, finalPath, totalDur, num, total, lesson.title);
      console.log(' done');

      // 8. Upload
      const storagePath = `hvac/hvac-lesson-${String(num).padStart(3, '0')}.mp4`;
      process.stdout.write('  Upload...');
      const url = await uploadVideo(finalPath, storagePath);
      console.log(' done');

      // 9. Update DB
      await supabase.from('training_lessons').update({ video_url: url }).eq('id', lesson.id);

      const mb = fs.statSync(finalPath).size / 1024 / 1024;
      console.log(`  ✅ ${totalDur.toFixed(0)}s | ${mb.toFixed(1)}MB | ${soraOk} clips`);
      ok++;

    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
      fail++;
    }

    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }

  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}

  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n=== DONE === ${ok} ok | ${fail} fail | ${mins} min | ~$${(ok * 1.35).toFixed(0)}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
