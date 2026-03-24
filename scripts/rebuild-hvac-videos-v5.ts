/**
 * HVAC Video V5 — Hybrid: HeyGen Avatar + Sora Demos + Slides
 *
 * Per lesson structure:
 *   1. HeyGen avatar intro (~30s) — Brandon greets, states learning objective
 *   2. Sora demo clips (3-5 clips, ~20-30s each) — equipment footage with TTS voiceover
 *   3. Slide segments (1-2) — key terms/definitions with TTS voiceover
 *   4. HeyGen avatar outro (~20s) — Brandon summarizes, directs to quiz
 *
 * All stitched with ffmpeg. Compressed to <50MB for Supabase upload.
 *
 * Usage:
 *   npx tsx scripts/rebuild-hvac-videos-v5.ts --start 4 --limit 1 --dry-run
 *   npx tsx scripts/rebuild-hvac-videos-v5.ts --start 4 --limit 1
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
const HEYGEN_KEY = process.env.HEYGEN_API_KEY!;

const HVAC_COURSE_ID = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';
const TEMP_DIR = path.join(process.cwd(), 'temp', 'hvac-v5');
const W = 1280;
const H = 720;
const FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

// HeyGen avatar config
const AVATAR_ID = 'Brandon_Business_Standing_Front_public';
const VOICE_ID = '6be73833ef9a4eb0aeee399b8fe9d62b';

interface LessonPlan {
  intro: { script: string; estSeconds: number };
  demos: { narration: string; soraPrompt: string; label: string; definition: string; estSeconds: number }[];
  slides: { title: string; bullets: string[]; narration: string; estSeconds: number }[];
  outro: { script: string; estSeconds: number };
  totalEstSeconds: number;
  heygenSeconds: number;
  soraClips: number;
  slideCount: number;
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

// ── GPT-4o: Plan the hybrid lesson ──────────────────────────────────

async function planLesson(title: string, content: string, lessonNum: number, total: number): Promise<LessonPlan> {
  const plain = htmlToPlain(content).slice(0, 5000);

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.4,
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are planning a training video for Elevate for Humanity's HVAC Technician Program (EPA 608 certification). Lesson ${lessonNum} of ${total}: "${title}"

CONTENT:
${plain}

Plan a hybrid video with these exact sections:

INTRO: The instructor avatar appears on camera and greets students. Write 40-60 words. State what this lesson covers and why it matters for their career. Conversational, warm, professional.

DEMOS: Plan 4 demonstration segments. Each one shows HVAC equipment or a technician performing a task while a narrator explains. For each:
- narration: 60-90 words. Thorough explanation. Slow, educational pace. Natural instructor tone.
- soraPrompt: Specific visual — what equipment, what action, what angle. Include "professional HVAC" or "HVAC training workshop". No text in video.
- label: Component/concept name (2-5 words)
- definition: Plain-English definition (10-18 words)

SLIDES: Plan 1 slide that summarizes key terms. Include:
- title: Slide heading (e.g., "Key Terms — Refrigerant Cycle")
- bullets: Array of 4-6 key points (short, study-guide style)
- narration: 40-60 words reading through the key points

OUTRO: The instructor avatar returns on camera. Write 30-45 words. Recap the main takeaway, mention the EPA 608 exam relevance, direct student to take the quiz below.

Return JSON only — no markdown:
{"intro":{"script":"..."},"demos":[{"narration":"...","soraPrompt":"...","label":"...","definition":"..."}],"slides":[{"title":"...","bullets":["..."],"narration":"..."}],"outro":{"script":"..."}}`
    }],
  });

  const raw = res.choices[0].message.content || '';
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  const plan = JSON.parse(cleaned);

  // Estimate durations (words / 2.2 words-per-second at 0.80x TTS speed)
  const wps = 2.2;
  const introEst = Math.ceil(plan.intro.script.split(/\s+/).length / wps);
  const outroEst = Math.ceil(plan.outro.script.split(/\s+/).length / wps);
  const demos = plan.demos.map((d: any) => ({
    ...d,
    estSeconds: Math.ceil(d.narration.split(/\s+/).length / wps),
  }));
  const slides = plan.slides.map((s: any) => ({
    ...s,
    estSeconds: Math.ceil(s.narration.split(/\s+/).length / wps),
  }));

  const totalEst = introEst + outroEst + demos.reduce((a: number, d: any) => a + d.estSeconds, 0) + slides.reduce((a: number, s: any) => a + s.estSeconds, 0);

  return {
    intro: { script: plan.intro.script, estSeconds: introEst },
    demos,
    slides,
    outro: { script: plan.outro.script, estSeconds: outroEst },
    totalEstSeconds: totalEst,
    heygenSeconds: introEst + outroEst,
    soraClips: demos.length,
    slideCount: slides.length,
  };
}

// ── HeyGen: Generate avatar clip ────────────────────────────────────

async function generateHeyGenClip(script: string, outputPath: string): Promise<void> {
  const res = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: 'avatar', avatar_id: AVATAR_ID, avatar_style: 'normal' },
        voice: { type: 'text', input_text: script, voice_id: VOICE_ID, speed: 1.0 },
      }],
      dimension: { width: 1280, height: 720 },
      test: false,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`HeyGen submit: ${JSON.stringify(data.error)}`);
  const videoId = data.data.video_id;

  // Poll
  for (let i = 0; i < 60; i++) {
    await sleep(10000);
    const poll = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-Api-Key': HEYGEN_KEY },
    });
    const pd = await poll.json();
    if (pd.data?.status === 'completed') {
      const dlRes = await fetch(pd.data.video_url);
      fs.writeFileSync(outputPath, Buffer.from(await dlRes.arrayBuffer()));
      // Re-encode to consistent format
      const norm = outputPath.replace('.mp4', '-norm.mp4');
      execSync(
        `ffmpeg -y -i "${outputPath}" -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,fps=30,format=yuv420p" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -ar 44100 -ac 2 -movflags +faststart "${norm}"`,
        { stdio: 'pipe' }
      );
      fs.renameSync(norm, outputPath);
      return;
    }
    if (pd.data?.status === 'failed') throw new Error(`HeyGen failed: ${pd.data.error}`);
  }
  throw new Error('HeyGen timeout');
}

// ── TTS: Generate narration audio ───────────────────────────────────

async function generateTTS(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd', voice: 'onyx', input: text.slice(0, 4096), speed: 0.80,
    response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  return probeDuration(outPath);
}

// ── Sora: Generate demo clip ────────────────────────────────────────

async function generateSoraClip(prompt: string, outPath: string): Promise<boolean> {
  try {
    const video = await openai.videos.create({ model: 'sora-2', prompt, size: '1280x720' } as any);
    for (let i = 0; i < 40; i++) {
      await sleep(5000);
      const s = await openai.videos.retrieve(video.id);
      if (s.status === 'completed') {
        const resp = await fetch(`https://api.openai.com/v1/videos/${video.id}/content`, {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        });
        if (resp.ok) {
          fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
          return true;
        }
        return false;
      }
      if (s.status === 'failed') return false;
    }
    return false;
  } catch { return false; }
}

// ── Slide: Generate slide video from text ───────────────────────────

function generateSlideVideo(title: string, bullets: string[], audioPath: string, outPath: string, duration: number): void {
  const safeTitle = esc(title).slice(0, 50);
  const bulletTexts = bullets.slice(0, 6).map((b, i) => {
    const safe = esc(b).slice(0, 70);
    const y = 200 + i * 55;
    return `drawtext=text='  ${safe}':fontfile=${FR}:fontsize=22:fontcolor=white@0.9:x=80:y=${y}`;
  });

  const vf = [
    `color=c=0x0f172a:s=${W}x${H}:d=${duration}:r=30`,
    `format=yuv420p`,
    // Elevate branding bar at top
    `drawbox=x=0:y=0:w=iw:h=60:color=0x1e40af@0.9:t=fill`,
    `drawtext=text='Elevate for Humanity':fontfile=${FB}:fontsize=18:fontcolor=white@0.8:x=20:y=20`,
    // Title
    `drawtext=text='${safeTitle}':fontfile=${FB}:fontsize=30:fontcolor=white:x=60:y=100`,
    // Underline
    `drawbox=x=60:y=145:w=400:h=3:color=0x3b82f6:t=fill`,
    // Bullets
    ...bulletTexts,
  ].join('[out];[out]');

  execSync(
    `ffmpeg -y -f lavfi -i "${vf}" -i "${audioPath}" ` +
    `-map 0:v -map 1:a -t ${duration} ` +
    `-c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -ar 44100 -ac 2 ` +
    `-movflags +faststart -shortest "${outPath}"`,
    { stdio: 'pipe' }
  );
}

// ── Demo segment: Sora clip looped + label overlay + TTS audio ──────

function buildDemoSegment(
  soraClipPath: string, audioPath: string, outPath: string,
  label: string, definition: string, duration: number
): void {
  const safeLabel = esc(label).slice(0, 35);
  const safeDef = esc(definition).slice(0, 65);

  const vf = [
    `fps=30`,
    `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black`,
    `format=yuv420p`,
    `drawbox=x=0:y=ih-120:w=iw:h=50:color=black@0.65:t=fill`,
    `drawtext=text='${safeLabel}':fontfile=${FB}:fontsize=24:fontcolor=white:x=30:y=h-115`,
    `drawtext=text='${safeDef}':fontfile=${FR}:fontsize=16:fontcolor=white@0.85:x=30:y=h-90`,
    `fade=in:0:12`,
    `fade=out:st=${Math.max(0, duration - 0.4)}:d=0.4`,
  ].join(',');

  execSync(
    `ffmpeg -y -stream_loop -1 -i "${soraClipPath}" -i "${audioPath}" ` +
    `-vf "${vf}" -map 0:v -map 1:a -t ${duration} ` +
    `-c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -ar 44100 -ac 2 ` +
    `-movflags +faststart -shortest "${outPath}"`,
    { stdio: 'pipe' }
  );
}

// ── Dark frame fallback for failed Sora clips ───────────────────────

function generateFallbackClip(outPath: string): void {
  execSync(
    `ffmpeg -y -f lavfi -i "color=c=0x1e293b:s=${W}x${H}:d=4:r=30" ` +
    `-vf "format=yuv420p" -c:v libx264 -preset fast -crf 23 -an "${outPath}"`,
    { stdio: 'pipe' }
  );
}

// ── Final assembly ──────────────────────────────────────────────────

function assembleVideo(segmentPaths: string[], outPath: string, lessonNum: number, total: number, title: string): void {
  const dir = path.dirname(outPath);
  const concatFile = path.join(dir, 'concat.txt');
  fs.writeFileSync(concatFile, segmentPaths.map(p => `file '${p}'`).join('\n'));

  const rawConcat = path.join(dir, 'raw-concat.mp4');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${rawConcat}"`, { stdio: 'pipe' });

  // Add bottom branding bar
  const safeTitle = esc(title).slice(0, 50);
  const label = `Lesson ${lessonNum} of ${total}`;

  execSync(
    `ffmpeg -y -i "${rawConcat}" -vf "` +
    `drawbox=x=0:y=ih-40:w=iw:h=40:color=0x0f172a@0.85:t=fill,` +
    `drawtext=text='${label}':fontfile=${FR}:fontsize=12:fontcolor=white@0.6:x=15:y=h-28,` +
    `drawtext=text='${safeTitle}':fontfile=${FB}:fontsize=14:fontcolor=white@0.8:x=160:y=h-28,` +
    `drawtext=text='Elevate for Humanity':fontfile=${FR}:fontsize=11:fontcolor=white@0.4:x=w-170:y=h-28` +
    `" -c:v libx264 -preset fast -crf 26 -c:a aac -b:a 96k ` +
    `-movflags +faststart "${outPath}"`,
    { stdio: 'pipe' }
  );

  try { fs.unlinkSync(concatFile); } catch {}
  try { fs.unlinkSync(rawConcat); } catch {}
}

// ── Upload ──────────────────────────────────────────────────────────

async function uploadVideo(localPath: string, storagePath: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const mb = buf.length / 1024 / 1024;
  if (mb > 49) throw new Error(`File too large: ${mb.toFixed(1)}MB (max 49MB)`);
  const { error } = await supabase.storage.from('course-videos')
    .upload(storagePath, buf, { contentType: 'video/mp4', upsert: true });
  if (error) throw new Error(`Upload: ${error.message}`);
  return supabase.storage.from('course-videos').getPublicUrl(storagePath).data.publicUrl;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const startIdx = parseInt(args[args.indexOf('--start') + 1] || '0');
  const limit = parseInt(args[args.indexOf('--limit') + 1] || '999');

  console.log('=== HVAC Video V5 — Hybrid: Avatar + Demos + Slides ===\n');

  const { data: lessons, error } = await supabase
    .from('course_lessons')
    .select('id, title, content, lesson_type, order_index')
    .eq('course_id', HVAC_COURSE_ID)
    .order('order_index');

  if (error || !lessons) { console.error('DB:', error?.message); process.exit(1); }

  const total = lessons.length;
  const end = Math.min(startIdx + limit, total);

  // Skip checkpoint lessons — video only for lesson and lab types
  const targets = lessons.slice(startIdx, end).filter(l => l.lesson_type !== 'checkpoint');
  console.log(`Total lessons: ${total} | Target: ${targets.length} (skipping quizzes)`);

  // ── PLAN PHASE (always runs, even dry-run) ──
  console.log('\n── Planning all lessons with GPT-4o ──\n');

  let totalHeygenSec = 0;
  let totalSoraClips = 0;
  let totalSlides = 0;
  let totalEstDuration = 0;
  const plans: { lesson: any; plan: LessonPlan }[] = [];

  for (const lesson of targets) {
    const num = lessons.indexOf(lesson) + 1;
    process.stdout.write(`  [${num}] ${lesson.title}...`);
    const plan = await planLesson(lesson.title, lesson.content || '', num, total);
    plans.push({ lesson, plan });
    totalHeygenSec += plan.heygenSeconds;
    totalSoraClips += plan.soraClips;
    totalSlides += plan.slideCount;
    totalEstDuration += plan.totalEstSeconds;
    console.log(` ${plan.totalEstSeconds}s (HeyGen: ${plan.heygenSeconds}s, Sora: ${plan.soraClips}, Slides: ${plan.slideCount})`);
  }

  console.log('\n── COST ESTIMATE ──');
  console.log(`  Total video duration: ~${Math.round(totalEstDuration / 60)} min`);
  console.log(`  HeyGen credits needed: ${totalHeygenSec}s (~${Math.round(totalHeygenSec / 60)} min)`);
  console.log(`  Sora clips: ${totalSoraClips} (~$${(totalSoraClips * 0.10).toFixed(0)})`);
  console.log(`  TTS segments: ${totalSoraClips + totalSlides}`);
  console.log(`  Slides: ${totalSlides}`);
  console.log(`  OpenAI est: ~$${(targets.length * 0.50).toFixed(0)}`);

  // Check HeyGen credits
  const quotaRes = await fetch('https://api.heygen.com/v2/user/remaining_quota', {
    headers: { 'X-Api-Key': HEYGEN_KEY },
  });
  const quota = await quotaRes.json();
  const remaining = quota.data?.remaining_quota || 0;
  console.log(`\n  HeyGen credits available: ${remaining}s (~${Math.round(remaining / 60)} min)`);
  if (totalHeygenSec > remaining) {
    console.log(`  ⚠️  SHORTFALL: Need ${totalHeygenSec - remaining}s more HeyGen credits`);
  } else {
    console.log(`  ✅ Enough HeyGen credits`);
  }

  if (dryRun) {
    console.log('\n── DRY RUN — No API calls made (except GPT-4o planning) ──');
    console.log('\nPer-lesson breakdown:');
    for (const { lesson, plan } of plans) {
      const num = lessons.indexOf(lesson) + 1;
      console.log(`\n  [${num}] ${lesson.title}`);
      console.log(`    Intro (HeyGen ~${plan.intro.estSeconds}s): "${plan.intro.script.slice(0, 80)}..."`);
      for (let i = 0; i < plan.demos.length; i++) {
        const d = plan.demos[i];
        console.log(`    Demo ${i + 1} (Sora ~${d.estSeconds}s): [${d.label}] "${d.narration.slice(0, 60)}..."`);
      }
      for (const s of plan.slides) {
        console.log(`    Slide (~${s.estSeconds}s): ${s.title} — ${s.bullets.length} bullets`);
      }
      console.log(`    Outro (HeyGen ~${plan.outro.estSeconds}s): "${plan.outro.script.slice(0, 80)}..."`);
      console.log(`    TOTAL: ~${plan.totalEstSeconds}s (${(plan.totalEstSeconds / 60).toFixed(1)} min)`);
    }
    return;
  }

  // ── BUILD PHASE ──
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  let ok = 0, fail = 0;
  const t0 = Date.now();

  for (const { lesson, plan } of plans) {
    const num = lessons.indexOf(lesson) + 1;
    const dir = path.join(TEMP_DIR, `L${String(num).padStart(3, '0')}`);
    fs.mkdirSync(dir, { recursive: true });

    console.log(`\n[${num}/${total}] ${lesson.title}`);

    try {
      const segmentPaths: string[] = [];

      // 1. HeyGen intro
      process.stdout.write('  Intro (HeyGen)...');
      const introPath = path.join(dir, 'intro.mp4');
      await generateHeyGenClip(plan.intro.script, introPath);
      segmentPaths.push(introPath);
      console.log(' done');

      // 2. Demo segments (Sora + TTS)
      for (let i = 0; i < plan.demos.length; i++) {
        const d = plan.demos[i];
        process.stdout.write(`  Demo ${i + 1} [${d.label}]...`);

        const audioPath = path.join(dir, `demo-audio-${i}.mp3`);
        const dur = await generateTTS(d.narration, audioPath);

        const soraPath = path.join(dir, `sora-${i}.mp4`);
        const soraOk = await generateSoraClip(d.soraPrompt, soraPath);
        if (!soraOk) generateFallbackClip(soraPath);

        const segPath = path.join(dir, `demo-${i}.mp4`);
        buildDemoSegment(soraPath, audioPath, segPath, d.label, d.definition, dur);
        segmentPaths.push(segPath);
        console.log(` ${dur.toFixed(0)}s ${soraOk ? '✓' : '(fallback)'}`);
      }

      // 3. Slides
      for (let i = 0; i < plan.slides.length; i++) {
        const s = plan.slides[i];
        process.stdout.write(`  Slide [${s.title}]...`);

        const audioPath = path.join(dir, `slide-audio-${i}.mp3`);
        const dur = await generateTTS(s.narration, audioPath);

        const slidePath = path.join(dir, `slide-${i}.mp4`);
        generateSlideVideo(s.title, s.bullets, audioPath, slidePath, dur);
        segmentPaths.push(slidePath);
        console.log(` ${dur.toFixed(0)}s`);
      }

      // 4. HeyGen outro
      process.stdout.write('  Outro (HeyGen)...');
      const outroPath = path.join(dir, 'outro.mp4');
      await generateHeyGenClip(plan.outro.script, outroPath);
      segmentPaths.push(outroPath);
      console.log(' done');

      // 5. Assemble
      process.stdout.write('  Assemble...');
      const finalPath = path.join(dir, 'final.mp4');
      assembleVideo(segmentPaths, finalPath, num, total, lesson.title);
      console.log(' done');

      // 6. Upload
      const storagePath = `hvac/hvac-lesson-${String(num).padStart(3, '0')}-v5.mp4`;
      process.stdout.write('  Upload...');
      const url = await uploadVideo(finalPath, storagePath);
      console.log(' done');

      // 7. Update DB
      await supabase.from('course_lessons').update({ video_url: url }).eq('id', lesson.id);

      const mb = fs.statSync(finalPath).size / 1024 / 1024;
      const dur = probeDuration(finalPath);
      console.log(`  ✅ ${dur.toFixed(0)}s | ${mb.toFixed(1)}MB`);
      ok++;

    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
      fail++;
    }

    // Cleanup lesson temp files
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }

  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}

  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n=== DONE === ${ok} ok | ${fail} fail | ${mins} min`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
