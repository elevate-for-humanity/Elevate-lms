/**
 * Rebuild HVAC Videos V3 — Full Instructional Videos
 *
 * Uses the existing repo tools to build proper training videos:
 *
 * Per lesson:
 *   1. GPT-4o plans 5-6 scenes (lesson-to-scenes)
 *   2. For each scene:
 *      - "slide" scenes → DALL-E background + text overlay + TTS narration
 *      - "demo" scenes → Sora demonstration clip + TTS narration + caption overlay
 *   3. Whisper generates word-level captions for the full audio
 *   4. FFmpeg composites everything with burned-in captions + branding
 *   5. Upload to Supabase, update DB
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/rebuild-hvac-videos-v3.ts --start 0 --limit 1
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/rebuild-hvac-videos-v3.ts --start 0 --limit 95
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
const TEMP_DIR = path.join(process.cwd(), 'temp', 'hvac-v3');
const VOICE: 'onyx' = 'onyx';
const WIDTH = 1280;
const HEIGHT = 720;

// ── Types ───────────────────────────────────────────────────────────────

interface PlannedScene {
  type: 'title' | 'slide' | 'demo';
  heading: string;
  bullets: string[];
  script: string;
  imagePrompt: string;   // DALL-E prompt for slide scenes
  soraPrompt: string;    // Sora prompt for demo scenes
  duration: number;
}

interface BuiltScene {
  videoPath: string;
  audioPath: string;
  duration: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<\/?(p|div|h[1-6]|li|tr|ul|ol|table|thead|tbody)[^>]*>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
}

function escapeFFmpeg(s: string): string {
  return s.replace(/'/g, '').replace(/:/g, ' -').replace(/&/g, 'and')
    .replace(/\\/g, '').replace(/"/g, '').replace(/\[/g, '(').replace(/\]/g, ')');
}

// ── Step 1: GPT-4o Scene Planning ───────────────────────────────────────

async function planScenes(
  lessonTitle: string, lessonContent: string, moduleNum: number, lessonNum: number
): Promise<PlannedScene[]> {
  const plain = htmlToPlain(lessonContent).slice(0, 4000);

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.4,
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are a video producer for Elevate for Humanity's HVAC Technician Training Program (EPA 608 certification). Plan a training video for this lesson.

LESSON ${lessonNum}: ${lessonTitle}
MODULE: ${moduleNum}

CONTENT:
${plain}

Create exactly 6 scenes alternating between instructional slides and hands-on demonstrations:

Scene 1: type "title" — Introduce the lesson topic
Scene 2: type "slide" — First teaching point with key concepts
Scene 3: type "demo" — Demonstrate what was just taught (hands-on HVAC work)
Scene 4: type "slide" — Second teaching point with details/procedures
Scene 5: type "demo" — Demonstrate the procedure just described
Scene 6: type "slide" — Summary and key takeaways

For each scene provide:
- type: "title", "slide", or "demo"
- heading: 3-6 word heading shown on screen
- bullets: 2-4 short bullet points shown on screen (for slide/title scenes) or empty for demo
- script: narrator script, 30-50 words, professional instructor tone. For demo scenes, describe what the viewer is seeing.
- imagePrompt: (slide/title only) DALL-E prompt for a professional HVAC training diagram or labeled illustration. Be specific: name components, show labels, use clean educational style. Include "professional technical diagram" or "labeled educational illustration". White or light background.
- soraPrompt: (demo only) Sora video prompt showing a real HVAC technician performing the specific task. Be very specific about what they're doing, what tools they're using, what equipment is visible. Include "professional HVAC technician", "hands-on demonstration", "well-lit workshop".
- duration: seconds (title=12, slide=25-35, demo=20-30)

Total duration: 2-3 minutes.

Return JSON only:
{"scenes": [{"type":"title","heading":"...","bullets":["..."],"script":"...","imagePrompt":"...","soraPrompt":"","duration":12}]}`
    }],
  });

  const raw = res.choices[0].message.content || '';
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  return parsed.scenes as PlannedScene[];
}

// ── Step 2: Generate Assets ─────────────────────────────────────────────

async function generateTTS(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd', voice: VOICE, input: text.slice(0, 3000), speed: 0.95,
    response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  try {
    const p = execSync(`ffprobe -v quiet -print_format json -show_format "${outPath}"`, { encoding: 'utf-8' });
    return parseFloat(JSON.parse(p).format?.duration || '10');
  } catch { return Math.ceil(text.split(/\s+/).length / 150 * 60) + 2; }
}

async function generateDALLE(prompt: string, outPath: string): Promise<void> {
  const res = await openai.images.generate({
    model: 'dall-e-3', prompt, n: 1, size: '1792x1024', quality: 'standard', style: 'natural',
  });
  const url = res.data[0]?.url;
  if (!url) throw new Error('No DALL-E URL');
  const resp = await fetch(url);
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
}

async function generateSoraClip(prompt: string, outPath: string): Promise<boolean> {
  try {
    const video = await openai.videos.create({ model: 'sora-2', prompt, size: '1280x720' });
    for (let i = 0; i < 40; i++) {
      await sleep(5000);
      const s = await openai.videos.retrieve(video.id);
      if (s.status === 'completed') {
        const resp = await fetch(`https://api.openai.com/v1/videos/${video.id}/content`, {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        });
        if (!resp.ok) return false;
        fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
        return true;
      }
      if (s.status === 'failed') return false;
    }
    return false;
  } catch { return false; }
}

// ── Step 3: Build Each Scene ────────────────────────────────────────────

async function buildSlideScene(
  scene: PlannedScene, dir: string, idx: number, lessonNum: number, total: number
): Promise<BuiltScene> {
  const audioPath = path.join(dir, `scene-${idx}-audio.mp3`);
  const imagePath = path.join(dir, `scene-${idx}-bg.png`);
  const videoPath = path.join(dir, `scene-${idx}.mp4`);

  // TTS
  const audioDur = await generateTTS(scene.script, audioPath);
  const dur = Math.max(audioDur + 1, scene.duration);

  // DALL-E background
  await generateDALLE(scene.imagePrompt, imagePath);

  // Build bullet text for overlay
  const heading = escapeFFmpeg(scene.heading).slice(0, 40);
  const bulletLines = scene.bullets.map((b, i) => escapeFFmpeg(b).slice(0, 50));

  // FFmpeg: image bg + text overlay + audio
  let drawFilters = `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p`;

  // Semi-transparent overlay bar for text readability
  drawFilters += `,drawbox=x=0:y=0:w=iw:h=ih*0.45:color=black@0.55:t=fill`;

  // Heading
  drawFilters += `,drawtext=text='${heading}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=32:fontcolor=white:x=40:y=30`;

  // Bullets
  bulletLines.forEach((b, i) => {
    drawFilters += `,drawtext=text='  ${b}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=22:fontcolor=white@0.95:x=50:y=${75 + i * 35}`;
  });

  // Lesson label at bottom
  const label = `Lesson ${lessonNum} of ${total}`;
  drawFilters += `,drawbox=x=0:y=ih-50:w=iw:h=50:color=black@0.7:t=fill`;
  drawFilters += `,drawtext=text='${label}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=14:fontcolor=white@0.6:x=20:y=h-35`;
  drawFilters += `,drawtext=text='Elevate for Humanity':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=14:fontcolor=white@0.4:x=w-200:y=h-35`;

  // Fade
  drawFilters += `,fade=in:0:15,fade=out:st=${Math.max(0, dur - 0.5)}:d=0.5`;

  execSync(
    `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" ` +
    `-vf "${drawFilters}" ` +
    `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 23 ` +
    `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
    `-t ${dur} -shortest -movflags +faststart "${videoPath}"`,
    { stdio: 'pipe' }
  );

  return { videoPath, audioPath, duration: dur };
}

async function buildDemoScene(
  scene: PlannedScene, dir: string, idx: number, lessonNum: number, total: number
): Promise<BuiltScene> {
  const audioPath = path.join(dir, `scene-${idx}-audio.mp3`);
  const soraPath = path.join(dir, `scene-${idx}-sora.mp4`);
  const videoPath = path.join(dir, `scene-${idx}.mp4`);

  // TTS
  const audioDur = await generateTTS(scene.script, audioPath);
  const dur = Math.max(audioDur + 1, scene.duration);

  // Sora demonstration clip
  const soraOk = await generateSoraClip(scene.soraPrompt, soraPath);

  const heading = escapeFFmpeg(scene.heading).slice(0, 40);
  const label = `Lesson ${lessonNum} of ${total}`;

  if (soraOk) {
    // Loop Sora clip to match audio, add "DEMONSTRATION" label + heading
    let drawFilters = `fps=30,scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p`;

    // "DEMONSTRATION" badge top-left
    drawFilters += `,drawbox=x=15:y=15:w=220:h=35:color=0x2563eb@0.9:t=fill`;
    drawFilters += `,drawtext=text='DEMONSTRATION':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=18:fontcolor=white:x=30:y=22`;

    // Heading below badge
    drawFilters += `,drawbox=x=15:y=55:w=500:h=35:color=black@0.6:t=fill`;
    drawFilters += `,drawtext=text='${heading}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=22:fontcolor=white:x=25:y=60`;

    // Bottom bar
    drawFilters += `,drawbox=x=0:y=ih-50:w=iw:h=50:color=black@0.7:t=fill`;
    drawFilters += `,drawtext=text='${label}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=14:fontcolor=white@0.6:x=20:y=h-35`;
    drawFilters += `,drawtext=text='Elevate for Humanity':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=14:fontcolor=white@0.4:x=w-200:y=h-35`;

    drawFilters += `,fade=in:0:15,fade=out:st=${Math.max(0, dur - 0.5)}:d=0.5`;

    execSync(
      `ffmpeg -y -stream_loop -1 -i "${soraPath}" -i "${audioPath}" ` +
      `-vf "${drawFilters}" ` +
      `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 23 ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-t ${dur} -shortest -movflags +faststart "${videoPath}"`,
      { stdio: 'pipe' }
    );
  } else {
    // Fallback: dark bg with heading if Sora fails
    execSync(
      `ffmpeg -y -f lavfi -i "color=c=0x1e293b:s=${WIDTH}x${HEIGHT}:d=${dur}:r=30" -i "${audioPath}" ` +
      `-vf "format=yuv420p,` +
      `drawtext=text='DEMONSTRATION':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=20:fontcolor=0x3b82f6:x=(w-tw)/2:y=h/2-50,` +
      `drawtext=text='${heading}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=32:fontcolor=white:x=(w-tw)/2:y=h/2,` +
      `fade=in:0:15" ` +
      `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 23 ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-t ${dur} -shortest -movflags +faststart "${videoPath}"`,
      { stdio: 'pipe' }
    );
  }

  return { videoPath, audioPath, duration: dur };
}

// ── Step 4: Whisper Captions ────────────────────────────────────────────

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
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
    srt += `${i + 1}\n${fmtSRT(seg.start)} --> ${fmtSRT(seg.end)}\n${line1}\n${line2 || ''}\n\n`;
  }
  if (!srt) srt = `1\n00:00:00,000 --> 00:05:00,000\n[Narration]\n\n`;
  fs.writeFileSync(srtPath, srt);
}

function fmtSRT(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

// ── Step 5: Final Assembly ──────────────────────────────────────────────

function assembleLesson(
  scenePaths: string[], fullAudioPath: string, srtPath: string,
  outputPath: string, duration: number
): void {
  // Concatenate scene videos
  const concatDir = path.dirname(outputPath);
  const concatFile = path.join(concatDir, 'concat.txt');
  fs.writeFileSync(concatFile, scenePaths.map(p => `file '${p}'`).join('\n'));

  const rawConcat = path.join(concatDir, 'raw-concat.mp4');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${rawConcat}"`,
    { stdio: 'pipe' }
  );

  // Burn captions onto concatenated video
  const safeSrt = srtPath.replace(/'/g, "'\\''").replace(/:/g, '\\:');
  execSync(
    `ffmpeg -y -i "${rawConcat}" ` +
    `-vf "subtitles='${safeSrt}':force_style='FontName=DejaVu Sans,FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1,MarginV=80,Alignment=2'" ` +
    `-c:v libx264 -preset fast -crf 22 -c:a copy -movflags +faststart "${outputPath}"`,
    { stdio: 'pipe' }
  );

  // Cleanup
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

  console.log('=== HVAC Video Rebuild V3 — Slides + Demonstrations + Captions ===\n');
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const { data: lessons, error } = await supabase
    .from('training_lessons')
    .select('id, title, content, content_type, order_index, lesson_number')
    .eq('course_id_uuid', HVAC_COURSE_ID)
    .order('order_index');

  if (error || !lessons) { console.error('DB:', error?.message); process.exit(1); }

  const total = lessons.length;
  const end = Math.min(startIdx + limit, total);

  // Cost estimate: per lesson ~$0.04 GPT + $0.08 DALL-E (2 slides) + $0.30 Sora (2 demos) + $0.15 TTS + $0.006 Whisper
  const estCost = (end - startIdx) * 0.58;
  const estTime = (end - startIdx) * 5; // ~5 min per lesson

  console.log(`Lessons: ${total} | Processing: ${startIdx}-${end - 1}`);
  console.log(`Est cost: ~$${estCost.toFixed(0)} | Est time: ~${estTime} min`);
  console.log(`Style: Title → Slide → Demo → Slide → Demo → Summary\n`);

  if (dryRun) { console.log('DRY RUN'); return; }

  let ok = 0, fail = 0;
  const t0 = Date.now();

  for (let i = startIdx; i < end; i++) {
    const lesson = lessons[i];
    const num = i + 1;
    const mod = Math.floor(lesson.order_index / 100);
    const dir = path.join(TEMP_DIR, `L${String(num).padStart(3, '0')}`);
    fs.mkdirSync(dir, { recursive: true });

    console.log(`\n[${num}/${total}] ${lesson.title}`);

    try {
      // 1. Plan scenes with GPT-4o
      process.stdout.write('  Planning...');
      const scenes = await planScenes(lesson.title, lesson.content || '', mod, num);
      console.log(` ${scenes.length} scenes`);

      // 2. Build each scene
      const builtScenes: BuiltScene[] = [];
      const allAudioPaths: string[] = [];

      for (let s = 0; s < scenes.length; s++) {
        const scene = scenes[s];
        const sceneLabel = `  Scene ${s + 1}/${scenes.length} (${scene.type})`;

        if (scene.type === 'demo' && scene.soraPrompt) {
          process.stdout.write(`${sceneLabel}: Sora+TTS...`);
          const built = await buildDemoScene(scene, dir, s, num, total);
          builtScenes.push(built);
          allAudioPaths.push(built.audioPath);
          console.log(` ${built.duration.toFixed(0)}s`);
        } else {
          process.stdout.write(`${sceneLabel}: DALL-E+TTS...`);
          const built = await buildSlideScene(scene, dir, s, num, total);
          builtScenes.push(built);
          allAudioPaths.push(built.audioPath);
          console.log(` ${built.duration.toFixed(0)}s`);
        }
      }

      // 3. Merge all audio for Whisper captions
      const fullAudioPath = path.join(dir, 'full-audio.mp3');
      const audioConcat = path.join(dir, 'audio-concat.txt');
      fs.writeFileSync(audioConcat, allAudioPaths.map(p => `file '${p}'`).join('\n'));
      execSync(
        `ffmpeg -y -f concat -safe 0 -i "${audioConcat}" -c copy "${fullAudioPath}"`,
        { stdio: 'pipe' }
      );

      // 4. Generate captions
      process.stdout.write('  Captions...');
      const srtPath = path.join(dir, 'captions.srt');
      await generateCaptions(fullAudioPath, srtPath);
      console.log(' done');

      // 5. Assemble final video
      const totalDur = builtScenes.reduce((s, b) => s + b.duration, 0);
      const finalPath = path.join(dir, 'final.mp4');
      process.stdout.write('  Assembling...');
      assembleLesson(
        builtScenes.map(b => b.videoPath),
        fullAudioPath, srtPath, finalPath, totalDur
      );
      console.log(' done');

      // 6. Upload
      const storagePath = `hvac/hvac-lesson-${String(num).padStart(3, '0')}.mp4`;
      process.stdout.write('  Uploading...');
      const url = await uploadVideo(finalPath, storagePath);
      console.log(' done');

      // 7. Update DB
      await supabase.from('training_lessons').update({ video_url: url }).eq('id', lesson.id);

      const mb = fs.statSync(finalPath).size / 1024 / 1024;
      console.log(`  ✅ ${totalDur.toFixed(0)}s | ${mb.toFixed(1)}MB | ${builtScenes.length} scenes`);
      ok++;

    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
      fail++;
    }

    // Cleanup
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }

  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}

  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n=== DONE === ${ok} ok | ${fail} fail | ${mins} min`);
  console.log(`Total cost: ~$${(ok * 0.58).toFixed(0)}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
