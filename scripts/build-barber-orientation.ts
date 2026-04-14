/**
 * Barber Apprenticeship Program — Orientation Video
 *
 * Milady order: #1 — What is Barbering, Indiana licensing, the profession
 * Same pipeline: real footage clips + single voiceover + lower-thirds
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import OpenAI from 'openai';

const ROOT      = '/workspaces/Elevate-lms';
const CLIPS_DIR = path.join(ROOT, 'public/videos/barber-orientation-clips');
const OUT_DIR   = path.join(ROOT, 'public/videos/barber-lessons');
const TEMP_DIR  = path.join(ROOT, 'temp/barber-orientation');
const OUTPUT    = path.join(OUT_DIR, 'barber-apprenticeship-intro.mp4');
const W = 1920;
const H = 1080;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface ClipDef { file: string; name: string; tagline: string; }

// All clips play sequentially under the narration — no looping, no repeats
// Lower-thirds change per segment block
const CLIPS: ClipDef[] = [
  { file: 'clip-6113143.mp4',  name: 'What is a Barber Apprenticeship?', tagline: 'Elevate for Humanity — Indiana DOL Registered Program' },
  { file: 'clip-4177803.mp4',  name: 'What is a Barber Apprenticeship?', tagline: 'Elevate for Humanity — Indiana DOL Registered Program' },
  { file: 'clip-4177973.mp4',  name: 'Learn While You Earn',              tagline: 'Get paid to train inside a real licensed barbershop' },
  { file: 'clip-4177951.mp4',  name: 'Learn While You Earn',              tagline: 'Get paid to train inside a real licensed barbershop' },
  { file: 'clip-4178342.mp4',  name: 'Learn While You Earn',              tagline: 'Get paid to train inside a real licensed barbershop' },
  { file: 'clip-4178112.mp4',  name: 'DOL Registered Program',            tagline: 'Registered with the U.S. Department of Labor' },
  { file: 'clip-4178099.mp4',  name: 'DOL Registered Program',            tagline: 'Registered with the U.S. Department of Labor' },
  { file: 'clip-4177799.mp4',  name: 'DOL Registered Program',            tagline: 'Registered with the U.S. Department of Labor' },
  { file: 'clip-7697085.mp4',  name: '2,000 Hours OJT',                   tagline: 'On-the-job training under a licensed master barber' },
  { file: 'clip-7697049.mp4',  name: '2,000 Hours OJT',                   tagline: 'On-the-job training under a licensed master barber' },
  { file: 'clip-7697073.mp4',  name: '2,000 Hours OJT',                   tagline: 'On-the-job training under a licensed master barber' },
  { file: 'clip-5450152.mp4',  name: 'Theory + Hands-On Training',        tagline: 'Online coursework combined with real shop experience' },
  { file: 'clip-4178139.mp4',  name: 'Theory + Hands-On Training',        tagline: 'Online coursework combined with real shop experience' },
  { file: 'clip-4177797.mp4',  name: 'Theory + Hands-On Training',        tagline: 'Online coursework combined with real shop experience' },
  { file: 'clip-7686519.mp4',  name: 'Your Shop Placement',               tagline: 'Assigned to a licensed Indiana barbershop from day one' },
  { file: 'clip-4177955.mp4',  name: 'Your Shop Placement',               tagline: 'Assigned to a licensed Indiana barbershop from day one' },
  { file: 'clip-4177957.mp4',  name: 'Your Shop Placement',               tagline: 'Assigned to a licensed Indiana barbershop from day one' },
  { file: 'clip-32000083.mp4', name: 'End Goal — Indiana Barber License', tagline: 'Pass the State Board exam and launch your career' },
  { file: 'clip-6071339.mp4',  name: 'End Goal — Indiana Barber License', tagline: 'Pass the State Board exam and launch your career' },
];

const NARRATION = `What is a barber apprenticeship? Let us break it down.

A barber apprenticeship is a DOL-registered training program that lets you earn your Indiana barber license by learning on the job. Instead of sitting in a classroom full time, you train inside a real licensed barbershop, working alongside a licensed master barber who supervises and mentors you every step of the way.

This program is registered with the United States Department of Labor. That means it meets federal standards for apprenticeship training and is fully recognized by the Indiana Professional Licensing Agency for the purpose of barber licensure.

Here is how it works. You will complete two thousand hours of on-the-job training inside your assigned barbershop. While you are doing that, you complete your theory coursework here on the Elevate platform. The two tracks run at the same time — hands-on in the shop, theory online.

Because this is a paid apprenticeship, you earn wages while you train. You are not just a student. You are a working apprentice building real skills with real clients from day one.

Your shop placement is assigned through the program. You will be placed with a licensed Indiana barbershop where your supervising master barber will verify your hours, sign off on your skills, and guide your development as a professional.

At the end of your apprenticeship, you will sit for the Indiana State Board exam — the written theory test and the practical skills exam. Pass both, and you receive your Indiana barber license.

This is the apprenticeship model. Learn while you earn. Train in the real world. Earn your license. Build your career.

Welcome to the Elevate for Humanity Barber Apprenticeship Program. Let us get started.`;

async function generateAudio(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd', voice: 'onyx',
    input: text.slice(0, 4096), speed: 0.88, response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  try {
    return parseFloat(execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outPath}"`,
      { encoding: 'utf-8' }
    ).trim()) || 60;
  } catch { return 60; }
}

function getVideoDuration(file: string): number {
  try {
    return parseFloat(execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`,
      { encoding: 'utf-8' }
    ).trim()) || 8;
  } catch { return 8; }
}

function buildClipWithText(videoFile: string, name: string, tagline: string, targetDur: number, outPath: string): void {
  const n = name.replace(/'/g, '').replace(/:/g, '');
  const t = tagline.replace(/'/g, '').replace(/:/g, '');
  execSync(
    `ffmpeg -y -i "${videoFile}" ` +
    `-filter_complex "[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,` +
    `drawbox=x=0:y=${H-110}:w=${W}:h=110:color=black@0.80:t=fill,` +
    `drawbox=x=0:y=${H-110}:w=5:h=110:color=0xf97316@1:t=fill,` +
    `drawtext=text='${n}':fontsize=40:fontcolor=white:` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=28:y=${H-88},` +
    `drawtext=text='${t}':fontsize=24:fontcolor=0xf97316:` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:x=28:y=${H-42},` +
    `fade=in:0:18,fade=out:st=${Math.max(0, targetDur-0.4)}:d=0.4[v]" ` +
    `-map "[v]" -c:v libx264 -preset ultrafast -crf 20 -r 30 -an -t ${targetDur} "${outPath}"`,
    { stdio: 'pipe' }
  );
}

async function main() {
  if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('\n=== Barber Apprenticeship Intro Video ===\n');

  process.stdout.write('Generating voiceover...');
  const audioPath = path.join(TEMP_DIR, 'narration.mp3');
  const audioDur = await generateAudio(NARRATION, audioPath);
  console.log(` ${audioDur.toFixed(0)}s`);

  const segPaths: string[] = [];
  for (let i = 0; i < CLIPS.length; i++) {
    const clip = CLIPS[i];
    const videoFile = path.join(CLIPS_DIR, clip.file);
    if (!fs.existsSync(videoFile)) { console.warn(`⚠️  Missing: ${clip.file}`); continue; }
    // Use natural clip duration — no looping, no stretching
    const clipDur = getVideoDuration(videoFile);
    process.stdout.write(`[${i+1}/${CLIPS.length}] ${clip.name} (${clipDur.toFixed(0)}s)...`);
    const segPath = path.join(TEMP_DIR, `seg-${String(i).padStart(2,'0')}.mp4`);
    buildClipWithText(videoFile, clip.name, clip.tagline, clipDur, segPath);
    segPaths.push(segPath);
    console.log(' ✓');
  }

  process.stdout.write('Stitching...');
  const stitched = path.join(TEMP_DIR, 'stitched.mp4');
  const cf = path.join(TEMP_DIR, 'concat.txt');
  fs.writeFileSync(cf, segPaths.map(p => `file '${p}'`).join('\n'));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${cf}" -c copy "${stitched}"`, { stdio: 'pipe' });
  console.log(' ✓');

  process.stdout.write('Muxing audio...');
  execSync(
    `ffmpeg -y -i "${stitched}" -i "${audioPath}" ` +
    `-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 ` +
    `-shortest -movflags +faststart "${OUTPUT}"`,
    { stdio: 'pipe' }
  );
  console.log(' ✓');

  const mb = fs.statSync(OUTPUT).size / 1024 / 1024;
  const dur = getVideoDuration(OUTPUT);
  console.log(`\n✅ ${OUTPUT}`);
  console.log(`   ${mb.toFixed(1)}MB | ${Math.floor(dur/60)}:${String(Math.round(dur%60)).padStart(2,'0')}`);

  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
