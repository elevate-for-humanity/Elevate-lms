/**
 * Barber Apprenticeship — Chapter 2: Infection Control & Safety
 * Full chapter — clips matched to narration content
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import OpenAI from 'openai';

const ROOT      = '/workspaces/Elevate-lms';
const CLIPS_DIR = path.join(ROOT, 'public/videos/barber-infection-clips');
const OUT_DIR   = path.join(ROOT, 'public/videos/barber-lessons');
const TEMP_DIR  = path.join(ROOT, 'temp/barber-infection');
const OUTPUT    = path.join(OUT_DIR, 'barber-infection-control.mp4');
const W = 1920;
const H = 1080;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface ClipDef { file: string; name: string; tagline: string; }

// ALL clips are 1920x1080 — no letterboxing, no cropping
const CLIPS: ClipDef[] = [
  // INTRO
  { file: 'clip-7697533.mp4',  name: 'Infection Control & Safety',       tagline: 'Chapter 2 — Milady Standard Barbering' },
  { file: 'clip-8867151.mp4',  name: 'Infection Control & Safety',       tagline: 'Protecting clients and yourself every service' },

  // WHY IT MATTERS
  { file: 'clip-4238767.mp4',  name: 'Why Sanitation Matters',           tagline: 'Every client trusts you with their health' },
  { file: 'clip-7686561.mp4',  name: 'Why Sanitation Matters',           tagline: 'Bacteria and viruses spread through contaminated tools' },

  // LEVEL 1 SANITATION — handwashing
  { file: 'clip-5967496.mp4',  name: 'Level 1 — Sanitation',             tagline: 'Physically removing visible dirt and debris' },
  { file: 'clip-34188817.mp4', name: 'Handwashing',                      tagline: 'Wash hands before and after every client' },
  { file: 'clip-4002684.mp4',  name: 'Handwashing — Proper Technique',   tagline: 'Soap, water, 20 seconds minimum' },
  { file: 'clip-3969477.mp4',  name: 'Handwashing — Proper Technique',   tagline: 'Soap, water, 20 seconds minimum' },
  { file: 'clip-4215906.mp4',  name: 'Wiping Down Your Station',         tagline: 'Clean surfaces between every client' },

  // LEVEL 2 DISINFECTION — tools in barbicide
  { file: 'clip-854723.mp4',   name: 'Level 2 — Disinfection',           tagline: 'Kills bacteria, viruses, and fungi on tools' },
  { file: 'clip-8327268.mp4',  name: 'Tools Soaking in Barbicide',       tagline: 'Implements submerged — 10 minute minimum soak' },
  { file: 'clip-7686590.mp4',  name: 'Combs & Brushes in Disinfectant',  tagline: 'All reusable tools fully submerged between clients' },
  { file: 'clip-8867153.mp4',  name: 'Barbicide — Industry Standard',    tagline: 'EPA-registered disinfectant required by State Board' },
  { file: 'clip-7697135.mp4',  name: 'Cleaning Clipper Blades',          tagline: 'Spray disinfectant on blades between every client' },

  // LEVEL 3 STERILIZATION — autoclave
  { file: 'clip-8704995.mp4',  name: 'Level 3 — Sterilization',          tagline: 'Kills all microorganisms including spores' },
  { file: 'clip-8852605.mp4',  name: 'Autoclave Sterilization',          tagline: 'Pressurized steam — highest level of decontamination' },
  { file: 'clip-8413470.mp4',  name: 'Autoclave in Use',                 tagline: 'Know the difference — tested on State Board exam' },

  // SINGLE USE
  { file: 'clip-7686554.mp4',  name: 'Single-Use Items',                 tagline: 'Used once — never reused on a second client' },
  { file: 'clip-6371944.mp4',  name: 'Disposable Razor Blades',          tagline: 'Fresh blade for every client — no exceptions' },
  { file: 'clip-7686591.mp4',  name: 'New Blade Every Client',           tagline: 'Used blade goes directly into sharps container' },
  { file: 'clip-6371938.mp4',  name: 'Neck Strips',                      tagline: 'Fresh neck strip every client — cape laundered daily' },

  // PPE — gloves
  { file: 'clip-1793366.mp4',  name: 'Personal Protective Equipment',    tagline: 'Gloves on before any chemical or blood exposure' },
  { file: 'clip-8204098.mp4',  name: 'Putting On Gloves',                tagline: 'PPE protects you and your client' },
  { file: 'clip-7469586.mp4',  name: 'PPE in the Shop',                  tagline: 'Know when gloves, masks, and eye protection are required' },

  // OSHA / BLOODBORNE
  { file: 'clip-8747445.mp4',  name: 'OSHA Bloodborne Pathogens',        tagline: 'Know your exposure control plan' },
  { file: 'clip-8460350.mp4',  name: 'Handling Accidental Cuts',         tagline: 'Stop service, glove up, treat wound, document' },
  { file: 'clip-3981834.mp4',  name: 'First Aid Protocol',               tagline: 'Never continue cutting until situation is handled' },

  // STATE BOARD
  { file: 'clip-8867156.mp4',  name: 'Indiana State Board Standards',    tagline: 'Sanitation is heavily tested — know every rule' },
  { file: 'clip-7697177.mp4',  name: 'Clean Shop = Professional Shop',   tagline: 'Your station reflects your standards as a barber' },

  // REVIEW
  { file: 'clip-6500684.mp4',  name: 'Chapter Review',                   tagline: 'Sanitation · Disinfection · Sterilization · OSHA' },
  { file: 'clip-4873231.mp4',  name: 'Chapter Review',                   tagline: 'Know the three levels — protect your clients every service' },
];

const NARRATION = `Welcome to Chapter 2 — Infection Control and Safety.

This chapter is one of the most heavily tested on the Indiana State Board exam. More importantly, these are the practices that protect your clients and protect you every single day you are in the shop. Take this seriously.

Let's start with why sanitation matters. Every client who sits in your chair is trusting you with their health. Bacteria, viruses, and fungi can spread through contaminated tools, surfaces, and contact. As a licensed barber, you have a legal and professional obligation to maintain a safe, sanitary environment.

Now let's break down the three levels of decontamination.

Level one is sanitation. Sanitation is the lowest level of decontamination. It means physically removing visible dirt, hair, debris, and contaminants from tools and surfaces. This includes sweeping your floor, wiping down your station, and washing your hands. Sanitation does not kill pathogens — it just removes physical contamination. You must wash your hands before and after every single client. No exceptions.

Level two is disinfection. Disinfection kills most bacteria, viruses, and fungi on non-living surfaces. This is what you do with your clippers, combs, shears, and all reusable metal tools between every client. You must use an EPA-registered disinfectant. Barbicide is the industry standard in barbershops. Tools must be fully submerged in the disinfectant solution for a minimum of ten minutes. Do not rush this. Do not skip this. This is a State Board requirement.

All reusable tools — clippers, trimmers, shears, combs, brushes — must be disinfected between every client. If a tool touches a client, it gets disinfected before it touches the next one.

Level three is sterilization. Sterilization kills all microorganisms including bacterial spores. This is the highest level of decontamination and requires an autoclave — a pressurized steam chamber. Most barbershops do not sterilize because they use disposable blades and disinfect reusable tools. But you must know the difference between all three levels for the State Board exam.

Now let's talk about single-use items. Some items are used once and thrown away — period. Razor blades are single-use. You put in a fresh blade for every client and dispose of the used blade in a sharps container. Never reuse a razor blade on a second client. This is a State Board violation and a health hazard. Neck strips are single-use. A fresh neck strip goes on every client. Your cape should be laundered daily.

Next — personal protective equipment and OSHA standards. OSHA, the Occupational Safety and Health Administration, sets federal standards for workplace safety. In a barbershop, this means understanding bloodborne pathogens, knowing how to handle an accidental cut, and having a written exposure control plan in your shop. If you accidentally cut a client, you stop the service, put on gloves, treat the wound, and document the incident. You do not continue cutting until the situation is handled.

The Indiana State Board will test you on all of this. Know the difference between sanitation, disinfection, and sterilization. Know that Barbicide requires a ten-minute soak. Know that razor blades are single-use. Know your OSHA basics. State Board inspectors also conduct shop inspections — they check your station setup, your disinfectant solution, your tools, and your records.

A clean shop is a professional shop. The way you maintain your station tells every client exactly what kind of barber you are. Build these habits now, from day one of your apprenticeship, and they will carry you through your entire career.

Let's review. Level one — sanitation — removes visible debris. Level two — disinfection — kills most pathogens on tools and surfaces using EPA-registered products like Barbicide. Level three — sterilization — kills everything using an autoclave. Single-use items are never reused. OSHA standards apply to your shop. And the Indiana State Board tests all of it.

You now have the foundation of infection control. Protect your clients. Protect yourself. Keep your shop clean.`;

async function generateAudio(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd', voice: 'alloy',
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

function buildClipWithText(videoFile: string, name: string, tagline: string, dur: number, outPath: string): void {
  const n = name.replace(/'/g, '').replace(/:/g, '');
  const t = tagline.replace(/'/g, '').replace(/:/g, '');
  execSync(
    `ffmpeg -y -i "${videoFile}" ` +
    `-filter_complex "[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,` +
    `drawbox=x=0:y=${H-110}:w=${W}:h=110:color=black@0.82:t=fill,` +
    `drawbox=x=0:y=${H-110}:w=5:h=110:color=0xf97316@1:t=fill,` +
    `drawtext=text='${n}':fontsize=40:fontcolor=white:` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=28:y=${H-88},` +
    `drawtext=text='${t}':fontsize=24:fontcolor=0xf97316:` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:x=28:y=${H-42},` +
    `fade=in:0:18,fade=out:st=${Math.max(0, dur-0.4)}:d=0.4[v]" ` +
    `-map "[v]" -c:v libx264 -preset ultrafast -crf 20 -r 30 -an -t ${dur} "${outPath}"`,
    { stdio: 'pipe' }
  );
}

async function main() {
  if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  console.log('\n=== Chapter 2: Infection Control & Safety ===\n');

  process.stdout.write('Generating voiceover...');
  const audioPath = path.join(TEMP_DIR, 'narration.mp3');
  const audioDur = await generateAudio(NARRATION, audioPath);
  console.log(` ${audioDur.toFixed(0)}s`);

  // Build video segments using natural clip durations
  const segPaths: string[] = [];
  let totalVideoDur = 0;
  for (let i = 0; i < CLIPS.length; i++) {
    const clip = CLIPS[i];
    const videoFile = path.join(CLIPS_DIR, clip.file);
    if (!fs.existsSync(videoFile)) { console.warn(`⚠️  Missing: ${clip.file}`); continue; }
    const clipDur = getVideoDuration(videoFile);
    totalVideoDur += clipDur;
    process.stdout.write(`[${i+1}/${CLIPS.length}] ${clip.name} (${clipDur.toFixed(0)}s)...`);
    const segPath = path.join(TEMP_DIR, `seg-${String(i).padStart(2,'0')}.mp4`);
    buildClipWithText(videoFile, clip.name, clip.tagline, clipDur, segPath);
    segPaths.push(segPath);
    console.log(' ✓');
  }
  console.log(`Total video: ${totalVideoDur}s | Audio: ${audioDur.toFixed(0)}s`);

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

  // Transcribe and burn captions
  process.stdout.write('Transcribing...');
  execSync(`ffmpeg -y -i "${audioPath}" -ar 16000 -ac 1 -c:a pcm_s16le /tmp/infection-audio.wav 2>/dev/null`, { stdio: 'pipe' });
  const KEY = process.env.OPENAI_API_KEY!;
  execSync(
    `curl -s https://api.openai.com/v1/audio/transcriptions ` +
    `-H "Authorization: Bearer ${KEY}" ` +
    `-F file=@/tmp/infection-audio.wav ` +
    `-F model=whisper-1 -F response_format=srt -F language=en ` +
    `-o /tmp/infection.srt`,
    { stdio: 'pipe' }
  );
  console.log(' ✓');

  process.stdout.write('Burning captions...');
  const captionOutput = OUTPUT.replace('.mp4', '-captions.mp4');
  // MarginV pushes captions down into the black zone below the video
  // Total frame is 1200px, video is 1080px, caption zone is 120px
  // MarginV=10 places text near bottom of the 120px black zone
  execSync(
    `ffmpeg -y -i "${OUTPUT}" ` +
    `-vf "subtitles=/tmp/infection.srt:` +
    `force_style='Fontname=DejaVu Sans,Fontsize=26,PrimaryColour=&Hffffff,` +
    `OutlineColour=&H000000,Outline=2,Shadow=0,Alignment=2,MarginV=10,Bold=1'" ` +
    `-c:v libx264 -preset ultrafast -crf 20 -c:a copy -movflags +faststart "${captionOutput}"`,
    { stdio: 'pipe' }
  );
  console.log(' ✓');

  const mb = fs.statSync(captionOutput).size / 1024 / 1024;
  const dur = getVideoDuration(captionOutput);
  console.log(`\n✅ ${captionOutput}`);
  console.log(`   ${mb.toFixed(1)}MB | ${Math.floor(dur/60)}:${String(Math.round(dur%60)).padStart(2,'0')}`);

  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
