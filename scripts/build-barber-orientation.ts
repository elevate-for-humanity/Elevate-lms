#!/usr/bin/env tsx
/**
 * Barber Apprenticeship Program - Orientation Video Generator
 *
 * Consolidated pipeline:
 * - one script
 * - Pexels clips fetched on demand
 * - one narration track
 * - lower-third titles for each scene
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import { execSync } from 'child_process';
import OpenAI from 'openai';
import { getSceneVideoClips } from '@/lib/video/pexels';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public/videos/barber-lessons');
const TEMP_DIR = path.join(ROOT, 'temp/barber-orientation');
const OUTPUT = path.join(OUT_DIR, 'barber-apprenticeship-intro.mp4');
const W = 1920;
const H = 1080;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface SceneDef {
  heading: string;
  keyword: string;
  tagline: string;
  narration: string;
}

const SCENES: SceneDef[] = [
  {
    heading: 'Welcome to the Program',
    keyword: 'barbershop interior professional atmosphere',
    tagline: 'Elevate for Humanity - Indiana Barber Apprenticeship',
    narration:
      'Welcome to the Elevate for Humanity Barber Apprenticeship Program. This orientation gives you the full picture before your first day: how the apprenticeship works, what is expected of you, and how to succeed.',
  },
  {
    heading: 'Learn While You Earn',
    keyword: 'barber apprentice training mentor',
    tagline: 'Train inside a real licensed barbershop',
    narration:
      'This is a United States Department of Labor registered apprenticeship. You train in a licensed barbershop, earn wages while you learn, and build toward your Indiana barber license through real work and structured instruction.',
  },
  {
    heading: 'Two Tracks',
    keyword: 'barber lesson laptop study',
    tagline: 'On-the-job training plus online theory',
    narration:
      'The program runs on two tracks at the same time. You complete on-the-job training in the shop and related technical instruction through the LMS. Both parts matter. Both parts move you toward licensure.',
  },
  {
    heading: 'Your Host Shop',
    keyword: 'barber consultation client service',
    tagline: 'A licensed shop mentors your growth',
    narration:
      'Your host shop is where the work happens. A licensed barber supervises your hours, checks your skills, and guides your development. That mentorship is part of the apprenticeship model.',
  },
  {
    heading: 'Clock In and Out',
    keyword: 'timesheet logging hours workplace',
    tagline: 'Track every shift accurately',
    narration:
      'Every shift starts with clocking in and ends with clocking out. Your hours are logged in the student portal, reviewed for accuracy, and used to track your progress toward the 2,000-hour requirement.',
  },
  {
    heading: 'Safety and Sanitation',
    keyword: 'cleaning tools disinfecting salon',
    tagline: 'Sanitation is non-negotiable',
    narration:
      'Safety is required on the floor. Tools must be disinfected, stations must stay clean, and you must follow all sanitation and safety protocols exactly as taught. That protects you, your clients, and your license.',
  },
  {
    heading: 'Professional Conduct',
    keyword: 'professional grooming workplace conduct',
    tagline: 'Represent the program with professionalism',
    narration:
      'Professional conduct matters every day. Show up on time, communicate clearly, and treat clients, instructors, and coworkers with respect. Your behavior on the floor reflects on you and on the program.',
  },
  {
    heading: 'Theory Lessons',
    keyword: 'studying exam notes classroom',
    tagline: 'Complete your LMS coursework',
    narration:
      'Your theory lessons live in the LMS. Work through them in order, complete the quizzes, and use the material to build the knowledge you need for state board preparation.',
  },
  {
    heading: 'Payment and Auto-Draft',
    keyword: 'billing payment method bank card',
    tagline: 'Weekly payments run automatically',
    narration:
      'Your payment plan is set up for automatic weekly billing. If a payment fails, you will receive a message with a link to update your payment method so you can stay current without losing progress.',
  },
  {
    heading: 'Support',
    keyword: 'customer support team office',
    tagline: 'Help is available if you need it',
    narration:
      'If you run into a problem, contact your coordinator right away. The goal is to solve issues early so your training, hours, and payments stay on track.',
  },
  {
    heading: 'Finish Strong',
    keyword: 'goal setting success planning',
    tagline: 'Finish the apprenticeship and earn your license',
    narration:
      'The goal is simple: complete your hours, finish your theory, pass your exam, and earn your Indiana barber license. This program is built to get you there, one week at a time.',
  },
];

function getFileDur(file: string): number {
  return parseFloat(
    execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${file}"`, {
      encoding: 'utf8',
    }).trim(),
  );
}

function escapeDrawtext(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/%/g, '\\%');
}

async function generateTTS(text: string, outPath: string): Promise<void> {
  const res = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'onyx',
    input: text,
    speed: 0.94,
    response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

async function downloadClip(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download clip: ${res.status}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

function buildScene(
  clipPath: string,
  audioPath: string,
  outPath: string,
  heading: string,
  tagline: string,
): void {
  const audioDur = getFileDur(audioPath);
  const clipDur = getFileDur(clipPath);
  const maxStart = Math.max(0, clipDur - audioDur - 0.8);
  const ss = maxStart > 1 ? Math.random() * maxStart : 0;
  const title = escapeDrawtext(heading);
  const subtitle = escapeDrawtext(tagline);

  execSync(
    `ffmpeg -y -ss ${ss.toFixed(2)} -i "${clipPath}" -i "${audioPath}" ` +
      `-vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
      `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=30,format=yuv420p,` +
      `drawbox=x=0:y=${H - 128}:w=${W}:h=128:color=black@0.72:t=fill,` +
      `drawbox=x=0:y=${H - 128}:w=6:h=128:color=0xf97316@1:t=fill,` +
      `drawtext=text='${title}':fontsize=34:fontcolor=white:` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=28:y=${H - 102},` +
      `drawtext=text='${subtitle}':fontsize=22:fontcolor=0xf97316:` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:x=28:y=${H - 58},` +
      `fade=in:0:18,fade=out:st=${Math.max(0, audioDur - 0.45)}:d=0.45[v]" ` +
      `-map "[v]" -map 1:a:0 -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k ` +
      `-t ${audioDur.toFixed(2)} -movflags +faststart "${outPath}"`,
    { stdio: 'pipe', maxBuffer: 500 * 1024 * 1024 },
  );
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set');
    process.exit(1);
  }

  if (!process.env.PEXELS_API_KEY) {
    console.error('PEXELS_API_KEY not set');
    process.exit(1);
  }

  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('\n=== Barber Apprenticeship Intro Video ===\n');
  console.log(`  ${SCENES.length} scenes\n`);

  const clipMap = await getSceneVideoClips(SCENES.map((scene) => scene.keyword));
  const scenePaths: string[] = [];

  try {
    for (let i = 0; i < SCENES.length; i++) {
      const scene = SCENES[i];
      const clipUrl = clipMap[scene.keyword];
      if (!clipUrl) {
        throw new Error(`No Pexels clip returned for: ${scene.keyword}`);
      }

      const audioPath = path.join(TEMP_DIR, `scene-${i}.mp3`);
      const clipPath = path.join(TEMP_DIR, `scene-${i}.mp4`);
      const scenePath = path.join(TEMP_DIR, `scene-${i}-assembled.mp4`);

      process.stdout.write(
        `  scene ${i + 1}/${SCENES.length} [${scene.keyword}] "${scene.heading}"...`,
      );
      await downloadClip(clipUrl, clipPath);
      await generateTTS(scene.narration, audioPath);
      buildScene(clipPath, audioPath, scenePath, scene.heading, scene.tagline);
      scenePaths.push(scenePath);
      process.stdout.write(' ✓\n');
    }

    const listFile = path.join(TEMP_DIR, 'concat.txt');
    fs.writeFileSync(listFile, scenePaths.map((file) => `file '${file}'').join('\n'));
    const rawPath = path.join(TEMP_DIR, 'raw.mp4');

    process.stdout.write('\n  concat scenes...');
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${rawPath}"`, {
      stdio: 'pipe',
      maxBuffer: 2000 * 1024 * 1024,
    });
    execSync(`ffmpeg -y -i "${rawPath}" -c copy -movflags +faststart "${OUTPUT}"`, {
      stdio: 'pipe',
      maxBuffer: 2000 * 1024 * 1024,
    });

    const totalDur = getFileDur(OUTPUT);
    const mins = Math.floor(totalDur / 60);
    const secs = Math.round(totalDur % 60);
    process.stdout.write(` ${mins}m ${secs}s ✅\n`);
    console.log(`\n  Output: ${OUTPUT}`);
    console.log('\n=== Done ===\n');
  } finally {
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
