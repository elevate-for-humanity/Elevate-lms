/**
 * Generate barber apprenticeship onboarding orientation video.
 * Output: public/videos/barber-lessons/barber-apprenticeship-orientation.mp4
 *
 *   pnpm tsx --env-file=.env.local scripts/generate-barber-orientation-video.ts
 */
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false });

import OpenAI from 'openai';
import { BARBER_ORIENTATION_VIDEO } from '../lib/barber/branding';

const OUT = path.join(process.cwd(), 'public/videos/barber-lessons/barber-apprenticeship-orientation.mp4');
const TEMP = path.join(process.cwd(), 'temp/barber-orientation');
const W = 1920;
const H = 1080;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SLIDES = [
  {
    title: 'Welcome to Prestige Elevation™',
    bullets: ['DOL Registered Apprenticeship', 'Indiana Barber License pathway', 'Elevate for Humanity'],
    narration:
      'Welcome to Prestige Elevation, your related technical instruction for the Barber Apprenticeship with Elevate for Humanity. This is a Department of Labor registered program designed to prepare you for the Indiana barber license.',
  },
  {
    title: '2,000 Hours Total',
    bullets: ['1,500 OJT at your host shop', '500 RTI on Elevate LMS', 'GPS timeclock for OJT'],
    narration:
      'You will complete two thousand hours total: fifteen hundred hours of on-the-job training at your licensed host barbershop, and five hundred hours of related technical instruction in your Prestige Elevation course online. Clock every shift with the Elevate timeclock.',
  },
  {
    title: 'Your RTI Course',
    bullets: ['Video lessons & quizzes', 'Module checkpoints', 'Dashboard at portal barber'],
    narration:
      'Your RTI lives on Elevate LMS. Each lesson includes video, reading, and quizzes. Pass checkpoints to unlock the next module. After onboarding and documents, open your barber dashboard to continue learning.',
  },
  {
    title: 'Payments & Conduct',
    bullets: ['Weekly auto-draft on Fridays', 'Keep card on file', 'Professional conduct required'],
    narration:
      'Tuition is billed weekly on the card you provided. If a payment fails, resolve it within seven days to avoid suspension. Represent Elevate professionally at your shop. Complete this orientation and handbook, then submit your documents.',
  },
];

async function tts(text: string, out: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'onyx',
    input: text.slice(0, 4096),
    speed: 0.88,
  });
  fs.writeFileSync(out, Buffer.from(await resp.arrayBuffer()));
  const dur = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${out}"`, {
    encoding: 'utf-8',
  }).trim();
  return parseFloat(dur) || 20;
}

async function slidePng(title: string, bullets: string[], out: string) {
  const { createCanvas } = await import('canvas');
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, W, 6);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 48px Arial';
  ctx.fillText('PRESTIGE ELEVATION™', 80, 100);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Arial';
  ctx.fillText(title, 80, 200);
  ctx.font = '32px Arial';
  ctx.fillStyle = '#d4d4d4';
  bullets.forEach((b, i) => ctx.fillText(`• ${b}`, 100, 320 + i * 56));
  fs.writeFileSync(out, canvas.toBuffer('image/png'));
}

function encode(png: string, audio: string, dur: number, out: string) {
  execSync(
    `ffmpeg -y -loop 1 -i "${png}" -i "${audio}" -c:v libx264 -tune stillimage -pix_fmt yuv420p -c:a aac -shortest -t ${dur + 0.5} "${out}"`,
    { stdio: 'pipe' },
  );
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY required');
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.mkdirSync(TEMP, { recursive: true });
  const segs: string[] = [];
  for (let i = 0; i < SLIDES.length; i++) {
    const s = SLIDES[i];
    const png = path.join(TEMP, `s${i}.png`);
    const mp3 = path.join(TEMP, `s${i}.mp3`);
    const seg = path.join(TEMP, `s${i}.mp4`);
    await slidePng(s.title, s.bullets, png);
    const dur = await tts(s.narration, mp3);
    encode(png, mp3, dur, seg);
    segs.push(seg);
    console.log(`✓ segment ${i + 1}`);
  }
  const list = path.join(TEMP, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${list}" -c copy "${OUT}"`, { stdio: 'inherit' });
  console.log(`✅ ${BARBER_ORIENTATION_VIDEO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
