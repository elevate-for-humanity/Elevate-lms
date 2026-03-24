/**
 * HVAC Lesson Video Generator
 *
 * Uses the existing lesson-video-renderer + lesson-script-generator pipeline.
 * Produces professional 1920x1080 slide-based videos:
 *   - Instructor photo (Marcus Johnson) lower-right
 *   - Branded slide layout with accent bars and bullets
 *   - GPT-4o narration script from DB lesson content
 *   - TTS audio (onyx voice, 0.85x speed)
 *   - Uploaded to Supabase course-videos bucket
 *   - video_url updated on course_lessons row
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/generate-hvac-lesson-videos.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/generate-hvac-lesson-videos.ts --start 0 --limit 5
 *   npx tsx --env-file=.env.local scripts/generate-hvac-lesson-videos.ts
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const HVAC_COURSE_ID = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';
const INSTRUCTOR_IMAGE = path.join(process.cwd(), 'public/images/team/instructors/instructor-trades.jpg');
const INSTRUCTOR_NAME = 'Marcus Johnson';
const INSTRUCTOR_TITLE = 'HVAC Master Technician';
const COURSE_NAME = 'HVAC Technician — EPA 608 Certification';
const TEMP_DIR = path.join(process.cwd(), 'temp/hvac-lesson-videos');
const W = 1920;
const H = 1080;
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ── Accent colors per segment ────────────────────────────────────────
const ACCENTS: Record<string, string> = {
  intro:       '#3b82f6',
  concept:     '#8b5cf6',
  visual:      '#10b981',
  application: '#f59e0b',
  wrapup:      '#3b82f6',
};

interface Slide {
  segment: 'intro' | 'concept' | 'visual' | 'application' | 'wrapup';
  title: string;
  bullets: string[];
  narration: string;
}

interface LessonPlan {
  slides: Slide[];
  totalWords: number;
  estSeconds: number;
}

// ── Strip HTML ───────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

// ── GPT-4o: Generate structured lesson plan ──────────────────────────
async function planLesson(
  title: string,
  content: string,
  lessonNum: number,
  moduleTitle: string,
  nextTitle?: string
): Promise<LessonPlan> {
  const plain = stripHtml(content).slice(0, 6000);

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `You are writing a professional instructional video script for the Elevate for Humanity HVAC Technician Training Program (EPA 608 certification prep).

Lesson ${lessonNum}: "${title}" — Module: "${moduleTitle}"
${nextTitle ? `Next lesson: "${nextTitle}"` : ''}

LESSON CONTENT:
${plain || 'No content yet — generate from the lesson title and EPA 608 context.'}

Produce a 5-segment lesson script. Return JSON only, no markdown:

{
  "slides": [
    {
      "segment": "intro",
      "title": "2-5 word slide heading",
      "bullets": ["3-4 short bullets, study-guide style"],
      "narration": "~50 words. Warm greeting, state lesson title, what student will learn, why it matters for EPA 608 or their career."
    },
    {
      "segment": "concept",
      "title": "Core concept heading",
      "bullets": ["4-6 key points"],
      "narration": "~300 words. Deep explanation. Use plain language. Cover the core technical content thoroughly. Slow, educational pace."
    },
    {
      "segment": "visual",
      "title": "System / Diagram heading",
      "bullets": ["3-5 visual reference points"],
      "narration": "~150 words. Walk through how the system or component looks and works. Reference what a technician would see on the job."
    },
    {
      "segment": "application",
      "title": "On the Job",
      "bullets": ["3-4 real-world application points"],
      "narration": "~100 words. How this applies on a real job site. What mistakes to avoid. What the EPA 608 exam tests on this topic."
    },
    {
      "segment": "wrapup",
      "title": "Lesson Summary",
      "bullets": ["3-4 key takeaways"],
      "narration": "~50 words. Recap the main points. ${nextTitle ? `Preview next lesson: ${nextTitle}.` : 'Direct student to the quiz below.'}"
    }
  ]
}`
    }],
  });

  const raw = res.choices[0].message.content || '';
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  const plan = JSON.parse(cleaned);

  const totalWords = plan.slides.reduce((sum: number, s: Slide) =>
    sum + s.narration.split(/\s+/).length, 0);
  const estSeconds = Math.ceil(totalWords / 2.4); // ~144 WPM at 0.85x speed

  return { slides: plan.slides, totalWords, estSeconds };
}

// ── TTS: Generate audio for a narration segment ──────────────────────
async function generateAudio(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'onyx',
    input: text.slice(0, 4096),
    speed: 0.85,
    response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  // Probe duration
  try {
    const dur = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    return parseFloat(dur) || 30;
  } catch { return 30; }
}

// ── Canvas: Render a slide frame matching exact Elevate template ─────
async function renderSlide(
  slide: Slide,
  slideIdx: number,
  totalSlides: number,
  lessonNum: number,
  moduleTitle: string,
  outPath: string,
  dalleImagePath?: string
): Promise<void> {
  const { createCanvas, loadImage } = await import('canvas');
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Background: dark navy #0f172a
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  // ── Top orange bar (Elevate brand)
  ctx.fillStyle = '#f97316';
  ctx.fillRect(0, 0, W, 8);

  // ── Section label — blue caps, top-left
  const SEGMENT_LABELS: Record<string, string> = {
    intro:       'LESSON INTRODUCTION',
    concept:     'CORE CONCEPT',
    visual:      'SYSTEM OVERVIEW',
    application: 'ON THE JOB',
    wrapup:      'LESSON SUMMARY',
  };
  const sectionLabel = SEGMENT_LABELS[slide.segment] || slide.segment.toUpperCase();
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(sectionLabel, 340, 80);

  // ── Lesson title — white bold large
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Arial';
  ctx.textBaseline = 'top';
  // Wrap title if too long
  const maxTitleW = W - 380;
  const titleWords = slide.title.split(' ');
  let titleLine = '';
  let titleY = 118;
  for (const word of titleWords) {
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

  // ── Blue underline under title
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(340, titleY + 62, 280, 3);

  // ── Bullets — circle outline dots
  const bulletStartY = titleY + 90;
  const bulletSpacing = 58;
  const maxBulletW = W - 420;
  slide.bullets.slice(0, 5).forEach((bullet, i) => {
    const y = bulletStartY + i * bulletSpacing;
    // Circle outline bullet
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(352, y + 14, 9, 0, Math.PI * 2);
    ctx.stroke();
    // Bullet text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '28px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const words = bullet.split(' ');
    let line = '';
    let lineY = y;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxBulletW && line) {
        ctx.fillText(line, 376, lineY);
        line = word;
        lineY += 34;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 376, lineY);
  });

  // ── DALL-E image — bottom left (270×220)
  const imgX = 56;
  const imgY = H - 320;
  const imgW = 270;
  const imgH = 220;

  if (dalleImagePath && fs.existsSync(dalleImagePath)) {
    try {
      const img = await loadImage(dalleImagePath);
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
    } catch { /* skip if load fails */ }
  } else {
    // Placeholder box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(imgX, imgY, imgW, imgH);
  }

  // ── Instructor name below image
  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${INSTRUCTOR_NAME}  |  ${INSTRUCTOR_TITLE}`, imgX, imgY + imgH + 12);

  // ── Bottom bar
  ctx.fillStyle = '#0a0f1a';
  ctx.fillRect(0, H - 48, W, 48);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`ELEVATE FOR HUMANITY  |  HVAC Technician  |  ${moduleTitle}`, 32, H - 24);

  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
}

// ── ffmpeg: Composite slide PNG + audio into MP4 segment ─────────────
function buildSegment(
  slidePng: string,
  audioMp3: string,
  duration: number,
  outPath: string
): void {
  execSync(
    `ffmpeg -y -loop 1 -i "${slidePng}" -i "${audioMp3}" ` +
    `-vf "scale=${W}:${H},format=yuv420p,fade=in:0:15,fade=out:st=${Math.max(0, duration - 0.5)}:d=0.5" ` +
    `-c:v libx264 -preset fast -crf 20 ` +
    `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
    `-t ${duration} -movflags +faststart "${outPath}"`,
    { stdio: 'pipe' }
  );
}

// ── ffmpeg: Concatenate segments into final video ────────────────────
function assembleVideo(segmentPaths: string[], outPath: string): void {
  const concatFile = outPath.replace('.mp4', '-concat.txt');
  fs.writeFileSync(concatFile, segmentPaths.map(p => `file '${p}'`).join('\n'));
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${outPath}"`,
    { stdio: 'pipe' }
  );
  try { fs.unlinkSync(concatFile); } catch {}
}

// ── Upload to Supabase storage ───────────────────────────────────────
async function uploadVideo(localPath: string, storagePath: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const mb = buf.length / 1024 / 1024;
  console.log(`    Uploading ${mb.toFixed(1)}MB...`);
  const { error } = await supabase.storage
    .from('course-videos')
    .upload(storagePath, buf, { contentType: 'video/mp4', upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from('course-videos').getPublicUrl(storagePath).data.publicUrl;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const forceAll = args.includes('--force');
  const startArg = args.indexOf('--start');
  const limitArg = args.indexOf('--limit');
  const startIdx = startArg >= 0 ? parseInt(args[startArg + 1]) : 0;
  const limit = limitArg >= 0 ? parseInt(args[limitArg + 1]) : 9999;

  console.log('=== HVAC Lesson Video Generator ===\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'} | Start: ${startIdx} | Limit: ${limit}\n`);

  // Fetch lessons
  const { data: lessons, error } = await supabase
    .from('course_lessons')
    .select(`
      id, title, content, lesson_type, order_index, video_url,
      module:module_id (title, order_index)
    `)
    .eq('course_id', HVAC_COURSE_ID)
    .order('order_index');

  if (error || !lessons) { console.error('DB error:', error?.message); process.exit(1); }

  // Only lesson-type rows, skip checkpoints
  const allLessons = lessons.filter((l: any) => l.lesson_type === 'lesson');
  // Regenerate if: no video, not in course-videos bucket, or --force
  const needsVideo = (l: any) =>
    forceAll || !l.video_url || !l.video_url.includes('/course-videos/');

  const targets = allLessons
    .filter(needsVideo)
    .slice(startIdx, startIdx + limit);

  console.log(`Total lesson-type rows: ${allLessons.length}`);
  console.log(`Already have real video: ${allLessons.filter((l: any) => l.video_url && !l.video_url.includes('/hvac/videos/')).length}`);
  console.log(`To generate: ${targets.length}\n`);

  if (!dryRun) fs.mkdirSync(TEMP_DIR, { recursive: true });

  let ok = 0, skip = 0, fail = 0;
  const t0 = Date.now();

  for (let i = 0; i < targets.length; i++) {
    const lesson = targets[i] as any;
    const moduleTitle = lesson.module?.title || 'HVAC Technician';
    const lessonNum = allLessons.indexOf(lesson) + 1;
    const nextLesson = allLessons[allLessons.indexOf(lesson) + 1] as any;

    console.log(`[${i + 1}/${targets.length}] Lesson ${lessonNum}: ${lesson.title}`);

    if (dryRun) {
      console.log(`  Module: ${moduleTitle}`);
      console.log(`  Content: ${stripHtml(lesson.content || '').length} chars`);
      console.log(`  Current video: ${lesson.video_url ? 'avatar loop' : 'none'}`);
      continue;
    }

    const dir = path.join(TEMP_DIR, `L${String(lessonNum).padStart(3, '0')}`);
    fs.mkdirSync(dir, { recursive: true });

    try {
      // 1. Plan lesson with GPT-4o
      process.stdout.write('  Planning...');
      const plan = await planLesson(
        lesson.title,
        lesson.content || '',
        lessonNum,
        moduleTitle,
        nextLesson?.title
      );
      console.log(` ${plan.totalWords} words, ~${Math.round(plan.estSeconds / 60)}:${String(plan.estSeconds % 60).padStart(2,'0')} min`);

      const segmentPaths: string[] = [];

      // 2. Generate DALL-E image for this lesson (one image reused across all slides)
      process.stdout.write('  DALL-E image...');
      const dalleImagePath = path.join(dir, 'dalle-bg.jpg');
      try {
        const imgPrompt = `Photorealistic professional HVAC training photo for lesson: "${lesson.title}". Show relevant HVAC equipment, tools, or job site. Clean, well-lit, professional training photography. No text or labels. 16:9 landscape.`;
        const imgRes = await openai.images.generate({
          model: 'dall-e-3',
          prompt: imgPrompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
          style: 'natural',
        });
        const imgUrl = imgRes.data[0]?.url;
        if (imgUrl) {
          const imgBuf = await fetch(imgUrl).then(r => r.arrayBuffer());
          fs.writeFileSync(dalleImagePath, Buffer.from(imgBuf));
          process.stdout.write(' ✓\n');
        }
      } catch { process.stdout.write(' skipped\n'); }

      // 3. Generate each slide
      for (let s = 0; s < plan.slides.length; s++) {
        const slide = plan.slides[s];
        process.stdout.write(`  [${slide.segment}] TTS...`);

        const audioPath = path.join(dir, `audio-${s}.mp3`);
        const duration = await generateAudio(slide.narration, audioPath);
        process.stdout.write(` ${duration.toFixed(0)}s | Slide...`);

        const slidePng = path.join(dir, `slide-${s}.png`);
        await renderSlide(slide, s, plan.slides.length, lessonNum, moduleTitle, slidePng, dalleImagePath);
        process.stdout.write(` Segment...`);

        const segPath = path.join(dir, `seg-${s}.mp4`);
        buildSegment(slidePng, audioPath, duration, segPath);
        segmentPaths.push(segPath);
        console.log(' ✓');
      }

      // 3. Assemble
      process.stdout.write('  Assembling...');
      const finalPath = path.join(dir, 'final.mp4');
      assembleVideo(segmentPaths, finalPath);
      const finalMb = fs.statSync(finalPath).size / 1024 / 1024;
      console.log(` ${finalMb.toFixed(1)}MB`);

      // 4. Upload
      const storagePath = `hvac/lesson-${lesson.id}-v2.mp4`;
      const url = await uploadVideo(finalPath, storagePath);

      // 5. Update DB
      await supabase
        .from('course_lessons')
        .update({ video_url: url, duration_minutes: Math.round(plan.estSeconds / 60) })
        .eq('id', lesson.id);

      console.log(`  ✅ ${url.slice(0, 80)}...`);
      ok++;

    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
      fail++;
    } finally {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
  }

  try { if (!dryRun) fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}

  const elapsed = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n=== DONE === ${ok} generated | ${skip} skipped | ${fail} failed | ${elapsed} min`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
