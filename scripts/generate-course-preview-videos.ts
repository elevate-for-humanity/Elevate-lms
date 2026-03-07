/**
 * Generate 30-second course preview MP4s for the catalog page.
 *
 * Each video = course photo background + branded overlay + first 30s of lesson MP3.
 * Uses @ffmpeg-installer (bundled binary) + fluent-ffmpeg + sharp.
 *
 * Output: public/generated/previews/course-{id}.mp4
 * Upload: npx tsx scripts/upload-course-previews-to-storage.ts
 *
 * Run: npx tsx scripts/generate-course-preview-videos.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
import { HVAC_LESSON_UUID } from '../lib/courses/hvac-uuids';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const OUT_DIR   = path.join(process.cwd(), 'public', 'generated', 'previews');
const AUDIO_DIR = path.join(process.cwd(), 'public', 'generated', 'lessons');
const IMG_DIR   = path.join(process.cwd(), 'public', 'images');

// Brand colors
const BLUE   = '#2563eb';
const RED    = '#dc2626';
const ORANGE = '#f97316';
const WHITE  = '#ffffff';

interface CoursePreview {
  id: string;
  title: string;
  tagline: string;
  salary: string;
  photo: string;         // relative to public/
  accentColor: string;
  lessonDefId?: string;  // first HVAC lesson to pull audio from
  audioFile?: string;    // explicit audio path relative to public/
}

const COURSES: CoursePreview[] = [
  {
    id: 'hvac-technician',
    title: 'HVAC Technician',
    tagline: 'Install & repair heating and cooling systems',
    salary: '$45,000–$75,000/yr',
    photo: 'images/pages/courses-page-4.jpg',
    accentColor: BLUE,
    lessonDefId: 'hvac-01-01',
  },
  {
    id: 'cna',
    title: 'Certified Nursing Assistant',
    tagline: 'Care for patients in hospitals & nursing homes',
    salary: '$32,000–$42,000/yr',
    photo: 'images/hp/healthcare.jpg',
    accentColor: '#16a34a',
    lessonDefId: 'hvac-01-01', // placeholder — swap when CNA audio exists
  },
  {
    id: 'cdl',
    title: 'Commercial Driver (CDL-A)',
    tagline: 'Drive semi-trucks and earn top pay',
    salary: '$55,000–$85,000/yr',
    photo: 'images/hp/candidates.jpg',
    accentColor: BLUE,
    lessonDefId: 'hvac-01-01',
  },
  {
    id: 'tax-preparation',
    title: 'Tax Preparation',
    tagline: 'Prepare tax returns & run your own business',
    salary: '$35,000–$60,000/yr',
    photo: 'images/hp/apply-online.jpg',
    accentColor: RED,
    lessonDefId: 'hvac-01-01',
  },
  {
    id: 'medical-assistant',
    title: 'Medical Assistant (CCMA)',
    tagline: 'Work alongside doctors in clinics',
    salary: '$36,000–$48,000/yr',
    photo: 'images/pages/courses-page-6.jpg',
    accentColor: '#16a34a',
    lessonDefId: 'hvac-01-01',
  },
  {
    id: 'phlebotomy',
    title: 'Phlebotomy Technician',
    tagline: 'Draw blood samples in labs & hospitals',
    salary: '$33,000–$42,000/yr',
    photo: 'images/pages/courses-page-7.jpg',
    accentColor: '#16a34a',
    lessonDefId: 'hvac-01-01',
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Specialist',
    tagline: 'Protect computers & networks from hackers',
    salary: '$55,000–$90,000/yr',
    photo: 'images/pages/courses-page-9.jpg',
    accentColor: BLUE,
    lessonDefId: 'hvac-01-01',
  },
  {
    id: 'excel',
    title: 'Microsoft Excel Certification',
    tagline: 'Master spreadsheets — every office needs this',
    salary: '$38,000–$55,000/yr',
    photo: 'images/pages/courses-page-11.jpg',
    accentColor: ORANGE,
    lessonDefId: 'hvac-01-01',
  },
  {
    id: 'osha-10',
    title: 'OSHA 10-Hour Safety',
    tagline: 'Required safety card for construction jobs',
    salary: 'Required for most construction jobs',
    photo: 'images/pages/courses-page-13.jpg',
    accentColor: RED,
    lessonDefId: 'hvac-01-01',
  },
];

/** Render a 1280×720 branded frame as PNG buffer */
async function renderFrame(course: CoursePreview): Promise<Buffer> {
  const W = 1280, H = 720;

  // Load and resize the course photo
  const photoPath = path.join(process.cwd(), 'public', course.photo);
  let photoBuf: Buffer;
  try {
    photoBuf = await sharp(photoPath)
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    // Fallback: solid color if photo missing
    photoBuf = await sharp({
      create: { width: W, height: H, channels: 3, background: { r: 30, g: 58, b: 138 } },
    }).jpeg().toBuffer();
  }

  // Draw overlay + text on canvas
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Load photo into canvas
  const photoImg = await loadImage(photoBuf);
  ctx.drawImage(photoImg, 0, 0, W, H);

  // Dark gradient overlay — left side for text readability
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.82)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.45)');
  grad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Bottom gradient for salary bar
  const botGrad = ctx.createLinearGradient(0, H - 120, 0, H);
  botGrad.addColorStop(0, 'rgba(0,0,0,0)');
  botGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H - 120, W, 120);

  // Accent bar — left edge
  ctx.fillStyle = course.accentColor;
  ctx.fillRect(0, 0, 8, H);

  // "ELEVATE FOR HUMANITY" top label
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('ELEVATE FOR HUMANITY', 48, 52);

  // Course title — large
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 72px Arial';
  // Word-wrap if needed
  const words = course.title.split(' ');
  let line = '';
  let y = 200;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > W - 96 && line) {
      ctx.fillText(line, 48, y);
      line = word;
      y += 84;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, 48, y);

  // Tagline
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.font = '32px Arial';
  ctx.fillText(course.tagline, 48, y + 60);

  // Salary pill
  ctx.fillStyle = course.accentColor;
  const pillX = 48, pillY = H - 80, pillW = 380, pillH = 48, pillR = 24;
  ctx.beginPath();
  ctx.moveTo(pillX + pillR, pillY);
  ctx.lineTo(pillX + pillW - pillR, pillY);
  ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + pillR);
  ctx.lineTo(pillX + pillW, pillY + pillH - pillR);
  ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - pillR, pillY + pillH);
  ctx.lineTo(pillX + pillR, pillY + pillH);
  ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - pillR);
  ctx.lineTo(pillX, pillY + pillR);
  ctx.quadraticCurveTo(pillX, pillY, pillX + pillR, pillY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(course.salary, pillX + 20, pillY + 32);

  // "Free to Apply" badge top-right
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.roundRect(W - 260, 30, 220, 44, 22);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FREE TO APPLY', W - 150, 59);

  return canvas.toBuffer('image/png');
}

/** Trim audio to maxSecs and return path to trimmed file */
async function trimAudio(audioSrc: string, maxSecs: number, tmpDir: string): Promise<string> {
  const trimmed = path.join(tmpDir, `trimmed-${Date.now()}.mp3`);
  return new Promise((resolve, reject) => {
    ffmpeg(audioSrc)
      .setStartTime(0)
      .setDuration(maxSecs)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .output(trimmed)
      .on('end', () => resolve(trimmed))
      .on('error', reject)
      .run();
  });
}

/** Combine still image + audio into MP4 */
async function makeVideo(framePng: string, audioMp3: string, outMp4: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(framePng)
      .inputOptions(['-loop 1'])
      .input(audioMp3)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-pix_fmt yuv420p',
        '-shortest',
        '-movflags +faststart',
        '-preset fast',
        '-crf 28',
      ])
      .output(outMp4)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
}

async function processOne(course: CoursePreview, tmpDir: string): Promise<'done' | 'skipped' | 'failed'> {
  const outPath = path.join(OUT_DIR, `course-${course.id}.mp4`);
  if (fs.existsSync(outPath)) {
    console.log(`  skip ${course.id} (already exists)`);
    return 'skipped';
  }

  // Resolve audio source
  let audioSrc: string | null = null;
  if (course.audioFile) {
    const p = path.join(process.cwd(), 'public', course.audioFile);
    if (fs.existsSync(p)) audioSrc = p;
  }
  if (!audioSrc && course.lessonDefId) {
    const uuid = HVAC_LESSON_UUID[course.lessonDefId];
    if (uuid) {
      const p = path.join(AUDIO_DIR, `lesson-${uuid}.mp3`);
      if (fs.existsSync(p)) audioSrc = p;
    }
  }
  if (!audioSrc) {
    console.error(`  SKIP ${course.id} — no audio source`);
    return 'skipped';
  }

  try {
    process.stdout.write(`  ${course.id} frame...`);
    const frameBuf = await renderFrame(course);
    const framePath = path.join(tmpDir, `frame-${course.id}.png`);
    fs.writeFileSync(framePath, frameBuf);

    process.stdout.write(` trim...`);
    const trimPath = await trimAudio(audioSrc, 30, tmpDir);

    process.stdout.write(` encode...`);
    await makeVideo(framePath, trimPath, outPath);

    const sizeMb = (fs.statSync(outPath).size / 1_048_576).toFixed(1);
    console.log(` done (${sizeMb} MB)`);
    return 'done';
  } catch (e: any) {
    console.error(`\n  FAIL ${course.id}: ${e.message}`);
    return 'failed';
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'elevate-previews-'));

  const pending = COURSES.filter(c => !fs.existsSync(path.join(OUT_DIR, `course-${c.id}.mp4`)));
  console.log(`Generating ${pending.length} course preview videos (${COURSES.length - pending.length} already done)...\n`);

  let done = 0, failed = 0, skipped = 0;
  for (const course of COURSES) {
    const r = await processOne(course, tmpDir);
    if (r === 'done')    done++;
    if (r === 'failed')  failed++;
    if (r === 'skipped') skipped++;
  }

  // Cleanup tmp
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\nDone: ${done} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
