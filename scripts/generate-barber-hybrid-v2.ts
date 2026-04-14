/**
 * Hybrid barber lesson renderer v2
 *
 * Skin  = barber-lesson-1.mp4 looped (cinematic real barbershop footage)
 * Skeleton = right-side teaching panel (title + bullets)
 * Audio = OpenAI TTS onyx 0.85x
 *
 * Per slide: loop bg video + overlay PNG panel + audio → segment
 * Concat all segments → final MP4
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const BG_VIDEO       = path.join(process.cwd(), 'public/videos/barber-lessons/barber-lesson-1.mp4');
const INSTRUCTOR_IMG = path.join(process.cwd(), 'public/images/team/instructors/instructor-barber.jpg');
const OUTPUT         = path.join(process.cwd(), 'public/videos/barber-lessons/barber-lesson-8-v2.mp4');
const TEMP_DIR       = path.join(process.cwd(), 'temp/barber-hybrid-v2');
const W = 1920;
const H = 1080;
const PANEL_X = Math.round(W * 0.62);
const PANEL_W = W - PANEL_X;

const INSTRUCTOR_NAME  = 'James Carter';
const INSTRUCTOR_TITLE = 'Master Barber & Educator';
const COURSE_NAME      = 'Professional Barbering — Indiana State Board Prep';

const ACCENTS: Record<string, string> = {
  intro: '#f97316', concept: '#8b5cf6', visual: '#10b981', application: '#f59e0b', wrapup: '#f97316',
};
const SEGMENT_LABELS: Record<string, string> = {
  intro: 'LESSON INTRODUCTION', concept: 'CORE CONCEPT', visual: 'TECHNIQUE OVERVIEW',
  application: 'IN THE SHOP', wrapup: 'LESSON SUMMARY',
};

interface Slide { segment: string; title: string; bullets: string[]; narration: string; }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function planLesson(title: string, content: string, moduleTitle: string): Promise<Slide[]> {
  const plain = stripHtml(content).slice(0, 6000);
  const res = await openai.chat.completions.create({
    model: 'gpt-4o', temperature: 0.3, max_tokens: 3000,
    messages: [{ role: 'user', content: `Professional barbering video script for Elevate for Humanity (Indiana State Board prep).

Lesson: "${title}" — Module: "${moduleTitle}"
Content: ${plain || 'Generate from lesson title and Indiana barbering context.'}

5 segments. Bullets must be SHORT (5 words max). Return JSON only:
{"slides":[
  {"segment":"intro","title":"short heading","bullets":["3-4 short bullets"],"narration":"~50 words"},
  {"segment":"concept","title":"heading","bullets":["4-5 bullets"],"narration":"~280 words"},
  {"segment":"visual","title":"heading","bullets":["3-4 bullets"],"narration":"~140 words"},
  {"segment":"application","title":"In the Shop","bullets":["3-4 bullets"],"narration":"~90 words"},
  {"segment":"wrapup","title":"Lesson Summary","bullets":["3-4 bullets"],"narration":"~50 words"}
]}` }],
  });
  const raw = res.choices[0].message.content || '';
  return JSON.parse(raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()).slides;
}

async function generateAudio(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({ model: 'tts-1-hd', voice: 'onyx', input: text.slice(0, 4096), speed: 0.85, response_format: 'mp3' });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  try {
    return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${outPath}"`, { encoding: 'utf-8' }).trim()) || 30;
  } catch { return 30; }
}

async function renderPanel(slide: Slide, moduleTitle: string, outPath: string): Promise<void> {
  const { createCanvas, loadImage } = await import('canvas');
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const accent = ACCENTS[slide.segment] || '#f97316';

  ctx.clearRect(0, 0, W, H);

  // Dark panel right side
  ctx.fillStyle = 'rgba(8, 12, 22, 0.87)';
  ctx.fillRect(PANEL_X, 0, PANEL_W, H);

  // Accent left edge
  ctx.fillStyle = accent;
  ctx.fillRect(PANEL_X, 0, 4, H);

  // Top bar full width
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 5);

  // Section label
  ctx.fillStyle = accent;
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(SEGMENT_LABELS[slide.segment] || '', PANEL_X + 36, 50);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Arial';
  ctx.textBaseline = 'top';
  const maxW = PANEL_W - 72;
  let line = ''; let titleY = 86;
  for (const word of slide.title.split(' ')) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, PANEL_X + 36, titleY); line = word; titleY += 48;
    } else line = test;
  }
  ctx.fillText(line, PANEL_X + 36, titleY);

  // Underline
  ctx.fillStyle = accent;
  ctx.fillRect(PANEL_X + 36, titleY + 48, 180, 3);

  // Bullets
  let bulletY = titleY + 72;
  for (const bullet of slide.bullets.slice(0, 5)) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(PANEL_X + 48, bulletY + 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '25px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let bline = ''; let bY = bulletY;
    for (const word of bullet.split(' ')) {
      const test = bline + (bline ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxW - 32 && bline) {
        ctx.fillText(bline, PANEL_X + 66, bY); bline = word; bY += 28;
      } else bline = test;
    }
    if (bline) ctx.fillText(bline, PANEL_X + 66, bY);
    bulletY = bY + 44;
  }

  // Instructor photo
  const imgX = PANEL_X + 36, imgY = H - 210, imgW = 150, imgH = 120;
  if (fs.existsSync(INSTRUCTOR_IMG)) {
    try {
      const img = await loadImage(INSTRUCTOR_IMG);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, 6);
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
      ctx.restore();
    } catch { /* skip */ }
  }
  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 15px Arial'; ctx.textBaseline = 'top';
  ctx.fillText(INSTRUCTOR_NAME, imgX + imgW + 12, imgY + 6);
  ctx.fillStyle = '#64748b'; ctx.font = '13px Arial';
  ctx.fillText(INSTRUCTOR_TITLE, imgX + imgW + 12, imgY + 26);

  // Bottom bar
  ctx.fillStyle = 'rgba(8,12,22,0.92)';
  ctx.fillRect(0, H - 42, W, 42);
  ctx.fillStyle = '#475569'; ctx.font = '14px Arial';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`ELEVATE FOR HUMANITY  ·  ${COURSE_NAME}  ·  ${moduleTitle}`, 28, H - 21);

  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
}

function buildSegment(panelPng: string, audioMp3: string, duration: number, outPath: string): void {
  const fadeOut = Math.max(0, duration - 0.5);
  execSync(
    `ffmpeg -y ` +
    `-stream_loop -1 -i "${BG_VIDEO}" ` +
    `-loop 1 -i "${panelPng}" ` +
    `-i "${audioMp3}" ` +
    `-filter_complex "[0:v]scale=${W}:${H},setsar=1[bg];[1:v]format=rgba[ov];[bg][ov]overlay=0:0,fade=in:0:18,fade=out:st=${fadeOut}:d=0.5[v]" ` +
    `-map "[v]" -map 2:a ` +
    `-c:v libx264 -preset fast -crf 20 -r 30 ` +
    `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
    `-t ${duration} -movflags +faststart "${outPath}"`,
    { stdio: 'pipe' }
  );
}

function assembleVideo(segPaths: string[], outPath: string): void {
  const cf = outPath.replace('.mp4', '-concat.txt');
  fs.writeFileSync(cf, segPaths.map(p => `file '${p}'`).join('\n'));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${cf}" -c copy -movflags +faststart "${outPath}"`, { stdio: 'pipe' });
  try { fs.unlinkSync(cf); } catch {}
}

async function main() {
  if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  if (!fs.existsSync(BG_VIDEO)) { console.error('BG video missing:', BG_VIDEO); process.exit(1); }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const { data: lesson, error } = await db
    .from('course_lessons')
    .select('id, slug, title, content, module:module_id(title)')
    .eq('slug', 'barber-lesson-8').single();
  if (error || !lesson) { console.error('DB fetch failed:', error?.message); process.exit(1); }

  const moduleTitle = (lesson.module as any)?.title || COURSE_NAME;
  const content = typeof lesson.content === 'object' ? (lesson.content as any)?.text || '' : lesson.content || '';

  console.log(`\n=== Hybrid v2: ${lesson.title} ===\n`);

  process.stdout.write('Planning...');
  const slides = await planLesson(lesson.title, content, moduleTitle);
  console.log(` ${slides.length} slides`);

  const segPaths: string[] = [];
  for (let s = 0; s < slides.length; s++) {
    const slide = slides[s];
    process.stdout.write(`[${s + 1}/${slides.length}] ${slide.segment} — TTS...`);
    const audioPath = path.join(TEMP_DIR, `audio-${s}.mp3`);
    const duration = await generateAudio(slide.narration, audioPath);
    process.stdout.write(` ${duration.toFixed(0)}s | Panel...`);
    const panelPng = path.join(TEMP_DIR, `panel-${s}.png`);
    await renderPanel(slide, moduleTitle, panelPng);
    process.stdout.write(` Encode...`);
    const segPath = path.join(TEMP_DIR, `seg-${s}.mp4`);
    buildSegment(panelPng, audioPath, duration, segPath);
    segPaths.push(segPath);
    console.log(' ✓');
  }

  process.stdout.write('Assembling...');
  assembleVideo(segPaths, OUTPUT);
  const mb = fs.statSync(OUTPUT).size / 1024 / 1024;
  console.log(` ${mb.toFixed(1)}MB`);

  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}
  console.log(`\n✅ ${OUTPUT}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
