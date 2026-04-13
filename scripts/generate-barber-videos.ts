/**
 * Barber Lesson Video Generator
 *
 * Slide-based pipeline (same approach as HVAC):
 *   GPT-4o script → Canvas slides → OpenAI TTS → ffmpeg -loop 1 → concat → local MP4
 *
 * Output: public/videos/barber-lessons/barber-lesson-N.mp4
 * Then updates video_url on course_lessons in DB.
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/generate-barber-videos.ts --dry-run
 *   pnpm tsx --env-file=.env.local scripts/generate-barber-videos.ts
 *   pnpm tsx --env-file=.env.local scripts/generate-barber-videos.ts --only barber-lesson-8,barber-lesson-12
 *   pnpm tsx --env-file=.env.local scripts/generate-barber-videos.ts --force
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const BARBER_COURSE_ID  = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const INSTRUCTOR_IMAGE  = path.join(process.cwd(), 'public/images/team/instructors/instructor-barber.jpg');
const INSTRUCTOR_NAME   = 'James Carter';
const INSTRUCTOR_TITLE  = 'Master Barber & Educator';
const COURSE_NAME       = 'Professional Barbering — Indiana State Board Prep';
const OUTPUT_DIR        = path.join(process.cwd(), 'public/videos/barber-lessons');
const TEMP_DIR          = path.join(process.cwd(), 'temp/barber-lesson-videos');
const W = 1920;
const H = 1080;

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE   = process.argv.includes('--force');

const args = process.argv.slice(2);
const onlyArg = args.find(a => a === '--only')
  ? args[args.indexOf('--only') + 1]
  : args.find(a => a.startsWith('--only='))?.replace('--only=', '');
const onlySlugs = onlyArg ? onlyArg.split(',').map(s => s.trim()) : null;

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const ACCENTS: Record<string, string> = {
  intro:       '#f97316',
  concept:     '#8b5cf6',
  visual:      '#10b981',
  application: '#f59e0b',
  wrapup:      '#f97316',
};

const SEGMENT_LABELS: Record<string, string> = {
  intro:       'LESSON INTRODUCTION',
  concept:     'CORE CONCEPT',
  visual:      'TECHNIQUE OVERVIEW',
  application: 'IN THE SHOP',
  wrapup:      'LESSON SUMMARY',
};

interface Slide {
  segment: 'intro' | 'concept' | 'visual' | 'application' | 'wrapup';
  title: string;
  bullets: string[];
  narration: string;
}

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

async function planLesson(
  title: string,
  content: string,
  moduleTitle: string,
  nextTitle?: string
): Promise<Slide[]> {
  const plain = stripHtml(content).slice(0, 6000);

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `You are writing a professional instructional video script for the Elevate for Humanity Professional Barbering Program (Indiana State Board exam prep).

Lesson: "${title}" — Module: "${moduleTitle}"
${nextTitle ? `Next lesson: "${nextTitle}"` : ''}

LESSON CONTENT:
${plain || 'Generate from the lesson title and Indiana barbering context.'}

Produce a 5-segment lesson script. Return JSON only, no markdown:

{
  "slides": [
    {
      "segment": "intro",
      "title": "2-5 word slide heading",
      "bullets": ["3-4 short bullets, study-guide style"],
      "narration": "~50 words. Warm greeting, state lesson title, what student will learn, why it matters for the Indiana State Board exam or their career."
    },
    {
      "segment": "concept",
      "title": "Core concept heading",
      "bullets": ["4-6 key points"],
      "narration": "~300 words. Deep explanation. Plain language. Cover the core technical content thoroughly."
    },
    {
      "segment": "visual",
      "title": "Technique heading",
      "bullets": ["3-5 visual reference points"],
      "narration": "~150 words. Walk through how the technique or tool looks and works in the shop."
    },
    {
      "segment": "application",
      "title": "In the Shop",
      "bullets": ["3-4 real-world application points"],
      "narration": "~100 words. Real barbershop application. Mistakes to avoid. What the Indiana State Board tests on this topic."
    },
    {
      "segment": "wrapup",
      "title": "Lesson Summary",
      "bullets": ["3-4 key takeaways"],
      "narration": "~50 words. Recap main points. ${nextTitle ? `Preview next lesson: ${nextTitle}.` : 'Direct student to the quiz below.'}"
    }
  ]
}`,
    }],
  });

  const raw = res.choices[0].message.content || '';
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned).slides as Slide[];
}

async function generateAudio(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'onyx',
    input: text.slice(0, 4096),
    speed: 0.85,
    response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  try {
    const dur = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    return parseFloat(dur) || 30;
  } catch { return 30; }
}

async function renderSlide(
  slide: Slide,
  moduleTitle: string,
  outPath: string
): Promise<void> {
  const { createCanvas, loadImage } = await import('canvas');
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const accent = ACCENTS[slide.segment] || '#f97316';

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 8);

  ctx.fillStyle = accent;
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(SEGMENT_LABELS[slide.segment] || slide.segment.toUpperCase(), 340, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Arial';
  ctx.textBaseline = 'top';
  const maxTitleW = W - 380;
  let titleLine = '';
  let titleY = 118;
  for (const word of slide.title.split(' ')) {
    const test = titleLine + (titleLine ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxTitleW && titleLine) {
      ctx.fillText(titleLine, 340, titleY);
      titleLine = word;
      titleY += 62;
    } else {
      titleLine = test;
    }
  }
  ctx.fillText(titleLine, 340, titleY);

  ctx.fillStyle = accent;
  ctx.fillRect(340, titleY + 62, 280, 3);

  const bulletStartY = titleY + 90;
  slide.bullets.slice(0, 5).forEach((bullet, i) => {
    const y = bulletStartY + i * 58;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(352, y + 14, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '28px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let line = '';
    let lineY = y;
    for (const word of bullet.split(' ')) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > W - 420 && line) {
        ctx.fillText(line, 376, lineY);
        line = word;
        lineY += 34;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 376, lineY);
  });

  // Instructor image — bottom left
  const imgX = 56, imgY = H - 320, imgW = 270, imgH = 220;
  if (fs.existsSync(INSTRUCTOR_IMAGE)) {
    try {
      const img = await loadImage(INSTRUCTOR_IMAGE);
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
    } catch { /* skip */ }
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(imgX, imgY, imgW, imgH);
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${INSTRUCTOR_NAME}  |  ${INSTRUCTOR_TITLE}`, imgX, imgY + imgH + 12);

  ctx.fillStyle = '#0a0f1a';
  ctx.fillRect(0, H - 48, W, 48);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`ELEVATE FOR HUMANITY  |  ${COURSE_NAME}  |  ${moduleTitle}`, 32, H - 24);

  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
}

function buildSegment(slidePng: string, audioMp3: string, duration: number, outPath: string): void {
  execSync(
    `ffmpeg -y -loop 1 -i "${slidePng}" -i "${audioMp3}" ` +
    `-vf "scale=${W}:${H},format=yuv420p,fade=in:0:15,fade=out:st=${Math.max(0, duration - 0.5)}:d=0.5" ` +
    `-c:v libx264 -preset fast -crf 20 ` +
    `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
    `-t ${duration} -movflags +faststart "${outPath}"`,
    { stdio: 'pipe' }
  );
}

function assembleVideo(segmentPaths: string[], outPath: string): void {
  const concatFile = outPath.replace('.mp4', '-concat.txt');
  fs.writeFileSync(concatFile, segmentPaths.map(p => `file '${p}'`).join('\n'));
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy -movflags +faststart "${outPath}"`,
    { stdio: 'pipe' }
  );
  try { fs.unlinkSync(concatFile); } catch {}
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set.');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!DRY_RUN) fs.mkdirSync(TEMP_DIR, { recursive: true });

  const { data: dbLessons, error: dbErr } = await db
    .from('course_lessons')
    .select('id, slug, title, content, lesson_type, order_index, module:module_id(title)')
    .eq('course_id', BARBER_COURSE_ID)
    .order('order_index');

  if (dbErr || !dbLessons) {
    console.error('DB fetch failed:', dbErr?.message);
    process.exit(1);
  }

  const allLessons = dbLessons as any[];
  const toProcess = onlySlugs
    ? allLessons.filter(l => onlySlugs.includes(l.slug))
    : allLessons;

  const missing = toProcess.filter(l => FORCE || !fs.existsSync(path.join(OUTPUT_DIR, `${l.slug}.mp4`)));

  console.log(`\n=== Barber Lesson Video Generator ===`);
  console.log(`DB lessons   : ${allLessons.length}`);
  console.log(`To process   : ${toProcess.length}`);
  console.log(`Need video   : ${missing.length}`);
  console.log(`Mode         : ${DRY_RUN ? 'DRY RUN' : 'LIVE'} | Force: ${FORCE}\n`);

  let ok = 0, skipped = 0, failed = 0;
  const t0 = Date.now();

  for (let i = 0; i < toProcess.length; i++) {
    const lesson = toProcess[i];
    const outPath = path.join(OUTPUT_DIR, `${lesson.slug}.mp4`);
    const moduleTitle = (lesson.module as any)?.title || COURSE_NAME;

    if (!FORCE && fs.existsSync(outPath)) {
      console.log(`⏭  [${i + 1}/${toProcess.length}] ${lesson.slug} — exists`);
      skipped++;
      continue;
    }

    const nextLesson = allLessons[allLessons.indexOf(lesson) + 1];
    console.log(`\n▶  [${i + 1}/${toProcess.length}] ${lesson.slug}: ${lesson.title}`);

    if (DRY_RUN) {
      const content = typeof lesson.content === 'object' ? lesson.content?.text || '' : lesson.content || '';
      console.log(`   Module  : ${moduleTitle}`);
      console.log(`   Content : ${stripHtml(content).length} chars`);
      continue;
    }

    const dir = path.join(TEMP_DIR, lesson.slug);
    fs.mkdirSync(dir, { recursive: true });

    try {
      process.stdout.write('   Planning...');
      const lessonContent = typeof lesson.content === 'object'
        ? lesson.content?.text || ''
        : lesson.content || '';
      const slides = await planLesson(lesson.title, lessonContent, moduleTitle, nextLesson?.title);
      console.log(` ${slides.length} slides`);

      const segmentPaths: string[] = [];

      for (let s = 0; s < slides.length; s++) {
        const slide = slides[s];
        process.stdout.write(`   [${slide.segment}] TTS...`);
        const audioPath = path.join(dir, `audio-${s}.mp3`);
        const duration = await generateAudio(slide.narration, audioPath);
        process.stdout.write(` ${duration.toFixed(0)}s | Slide...`);
        const slidePng = path.join(dir, `slide-${s}.png`);
        await renderSlide(slide, moduleTitle, slidePng);
        process.stdout.write(` Encode...`);
        const segPath = path.join(dir, `seg-${s}.mp4`);
        buildSegment(slidePng, audioPath, duration, segPath);
        segmentPaths.push(segPath);
        console.log(' ✓');
      }

      process.stdout.write('   Assembling...');
      assembleVideo(segmentPaths, outPath);
      const mb = fs.statSync(outPath).size / 1024 / 1024;
      console.log(` ${mb.toFixed(1)}MB`);

      const videoUrl = `/videos/barber-lessons/${lesson.slug}.mp4`;
      const { error: updateErr } = await db
        .from('course_lessons')
        .update({ video_url: videoUrl })
        .eq('id', lesson.id);
      if (updateErr) console.warn(`   ⚠️  DB update failed: ${updateErr.message}`);
      else console.log(`   ✅ ${videoUrl}`);

      ok++;
    } catch (err: any) {
      console.error(`   ❌ ${lesson.slug}: ${err.message}`);
      failed++;
    } finally {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
  }

  try { if (!DRY_RUN) fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}

  const elapsed = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n=== DONE === ${ok} generated | ${skipped} skipped | ${failed} failed | ${elapsed} min`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
