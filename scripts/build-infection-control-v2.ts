/**
 * Infection Control Video — v2
 *
 * Semantic locking: every clip matches the exact procedure being narrated.
 * Rule: handwashing lines → handwashing clips
 *       Barbicide/disinfectant lines → barbicide_soak + tool_cleaning clips
 *       autoclave/sterilization lines → autoclave clips
 *       single-use/razor lines → sharps + tool_storage clips
 *       PPE/gloves lines → gloves_ppe clips
 *       OSHA/first-aid lines → first_aid clips
 *       shop/station lines → barbershop_general clips
 *
 * Narration is split into 20 timed segments. Each segment gets one clip.
 * Clips loop if shorter than the segment duration.
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import OpenAI from 'openai';

const ROOT      = process.cwd();
const CLIPS_DIR = path.join(ROOT, 'public/videos/barber-infection-clips');
const OUT_DIR   = path.join(ROOT, 'public/videos/barber-lessons');
const TEMP_DIR  = path.join(ROOT, 'temp/infection-v2');
const OUTPUT    = path.join(OUT_DIR, 'barber-infection-control.mp4');
const W = 1920;
const H = 1080;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ── Narration split into 20 semantic segments ─────────────────────────────────
// Each segment maps to exactly one clip category and one clip file.
// Clips are looped if shorter than the segment.

interface Segment {
  text: string;           // narration for this segment
  clip: string;           // clip filename
  title: string;          // lower-third title
  tagline: string;        // lower-third tagline
}

const SEGMENTS: Segment[] = [
  // INTRO — barbershop general / client service
  {
    text: `Welcome to Chapter 2 — Infection Control and Safety. This chapter is one of the most heavily tested on the Indiana State Board exam.`,
    clip: 'clip-7697533.mp4',   // barber trimming client beard — professional shop intro
    title: 'Infection Control & Safety',
    tagline: 'Chapter 2 — Indiana State Board Prep',
  },
  {
    text: `More importantly, these are the practices that protect your clients and protect you every single day you are in the shop. Take this seriously.`,
    clip: 'clip-7686554.mp4',   // barber shaving client neck — professional service
    title: 'Protecting Clients & Yourself',
    tagline: 'Every service. No exceptions.',
  },

  // WHY IT MATTERS — shop cleanliness
  {
    text: `Every client who sits in your chair is trusting you with their health. Bacteria, viruses, and fungi can spread through contaminated tools, surfaces, and contact.`,
    clip: 'clip-6196263.mp4',   // wiping down surface in barbershop
    title: 'Why Sanitation Matters',
    tagline: 'Contaminated tools spread bacteria, viruses, and fungi',
  },
  {
    text: `As a licensed barber, you have a legal and professional obligation to maintain a safe, sanitary environment.`,
    clip: 'clip-8867156.mp4',   // barber dusting/cleaning chair
    title: 'Your Legal Obligation',
    tagline: 'Indiana State Board requires a clean, safe shop',
  },

  // LEVEL 1 — SANITATION (handwashing + sweeping)
  {
    text: `Now let's break down the three levels of decontamination. Level one is sanitation. Sanitation is the lowest level — it means physically removing visible dirt, hair, debris, and contaminants from tools and surfaces.`,
    clip: 'clip-5592525.mp4',   // sweeping hair off floor
    title: 'Level 1 — Sanitation',
    tagline: 'Physically removing visible dirt and debris',
  },
  {
    text: `This includes sweeping your floor, wiping down your station, and washing your hands. Sanitation does not kill pathogens — it just removes physical contamination.`,
    clip: 'clip-6865253.mp4',   // sweeping hair into dustpan
    title: 'Sanitation — Station & Floor',
    tagline: 'Sweep, wipe, wash — between every client',
  },
  {
    text: `You must wash your hands before and after every single client. No exceptions.`,
    clip: 'clip-34188817.mp4',  // handwashing at sink with soap
    title: 'Handwashing — Every Client',
    tagline: 'Soap and water — 20 seconds minimum',
  },
  {
    text: `Wash thoroughly — soap, water, twenty seconds minimum. This is the foundation of every safe service.`,
    clip: 'clip-4115328.mp4',   // thorough handwashing at sink
    title: 'Proper Handwashing Technique',
    tagline: 'Before and after every client — no exceptions',
  },

  // LEVEL 2 — DISINFECTION (Barbicide / tool cleaning)
  {
    text: `Level two is disinfection. Disinfection kills most bacteria, viruses, and fungi on non-living surfaces. This is what you do with your clippers, combs, shears, and all reusable metal tools between every client.`,
    clip: 'clip-7697046.mp4',   // clippers in soiled implements tray
    title: 'Level 2 — Disinfection',
    tagline: 'Kills bacteria, viruses, and fungi on tools',
  },
  {
    text: `You must use an EPA-registered disinfectant. Barbicide is the industry standard in barbershops. Tools must be fully submerged in the disinfectant solution for a minimum of ten minutes.`,
    clip: 'clip-31234281.mp4',  // beaker with blue Barbicide solution
    title: 'Barbicide — Industry Standard',
    tagline: 'EPA-registered disinfectant — 10 minute minimum soak',
  },
  {
    text: `Do not rush this. Do not skip this. All reusable tools — clippers, trimmers, shears, combs, brushes — must be disinfected between every client. If a tool touches a client, it gets disinfected before it touches the next one.`,
    clip: 'clip-854723.mp4',    // blue solution being mixed into jar — implements submerged
    title: 'All Reusable Tools — Disinfected',
    tagline: 'Every tool that touches a client must be disinfected',
  },
  {
    text: `Spray disinfectant on clipper blades between every client. Brush out all hair first, then spray, then wipe.`,
    clip: 'clip-7686551.mp4',   // spray disinfectant on scissors
    title: 'Clipper & Scissor Disinfection',
    tagline: 'Brush → spray → wipe — between every client',
  },

  // LEVEL 3 — STERILIZATION (autoclave)
  {
    text: `Level three is sterilization. Sterilization kills all microorganisms including bacterial spores. This is the highest level of decontamination and requires an autoclave — a pressurized steam chamber.`,
    clip: 'clip-8704995.mp4',   // person placing tools in autoclave
    title: 'Level 3 — Sterilization',
    tagline: 'Kills all microorganisms including spores',
  },
  {
    text: `Most barbershops do not sterilize because they use disposable blades and disinfect reusable tools. But you must know the difference between all three levels for the State Board exam.`,
    clip: 'clip-8852605.mp4',   // autoclave in use
    title: 'Autoclave — Pressurized Steam',
    tagline: 'Know the difference — tested on State Board exam',
  },

  // SINGLE USE — razors / neck strips
  {
    text: `Now let's talk about single-use items. Razor blades are single-use. You put in a fresh blade for every client and dispose of the used blade in a sharps container. Never reuse a razor blade on a second client.`,
    clip: 'clip-7314354.mp4',   // hands holding straight razor — blade change
    title: 'Single-Use Items',
    tagline: 'Fresh blade every client — used blade into sharps container',
  },
  {
    text: `Neck strips are single-use. A fresh neck strip goes on every client. Your cape should be laundered daily.`,
    clip: 'clip-7697118.mp4',   // barber placing neck strip / draping client
    title: 'Neck Strips & Capes',
    tagline: 'Fresh neck strip every client — cape laundered daily',
  },

  // PPE / GLOVES
  {
    text: `Next — personal protective equipment. Gloves on before any chemical service or blood exposure. Know when gloves, masks, and eye protection are required.`,
    clip: 'clip-7469584.mp4',   // putting on disposable gloves
    title: 'Personal Protective Equipment',
    tagline: 'Gloves on before chemical or blood exposure',
  },

  // OSHA / BLOODBORNE / FIRST AID
  {
    text: `OSHA sets federal standards for workplace safety. In a barbershop, this means understanding bloodborne pathogens and having a written exposure control plan. If you accidentally cut a client, stop the service, put on gloves, treat the wound, and document the incident.`,
    clip: 'clip-3981834.mp4',   // first aid / bandaging practice
    title: 'OSHA & Bloodborne Pathogens',
    tagline: 'Stop service → glove up → treat wound → document',
  },

  // STATE BOARD
  {
    text: `The Indiana State Board will test you on all of this. Know the difference between sanitation, disinfection, and sterilization. Know that Barbicide requires a ten-minute soak. Know that razor blades are single-use. State Board inspectors conduct shop inspections — they check your station, your disinfectant solution, your tools, and your records.`,
    clip: 'clip-8413470.mp4',   // autoclave operation — professional sterilization
    title: 'Indiana State Board Standards',
    tagline: 'Sanitation · Disinfection · Sterilization — know all three',
  },

  // CLOSE
  {
    text: `A clean shop is a professional shop. The way you maintain your station tells every client exactly what kind of barber you are. Build these habits now, from day one of your apprenticeship, and they will carry you through your entire career. Protect your clients. Protect yourself. Keep your shop clean.`,
    clip: 'clip-9182383.mp4',   // cleaning door handle with disinfectant — clean shop
    title: 'A Clean Shop Is a Professional Shop',
    tagline: 'Build these habits from day one',
  },
];

// Full narration for TTS (all segments joined)
const NARRATION = SEGMENTS.map(s => s.text).join('\n\n');

async function generateAudio(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd', voice: 'alloy', speed: 0.88,
    input: text.slice(0, 4096), response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  try {
    return parseFloat(execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outPath}"`,
      { encoding: 'utf-8' }
    ).trim()) || 10;
  } catch { return 10; }
}

function getVideoDuration(file: string): number {
  try {
    return parseFloat(execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`,
      { encoding: 'utf-8' }
    ).trim()) || 8;
  } catch { return 8; }
}

function buildSegmentClip(
  videoFile: string,
  title: string,
  tagline: string,
  audioDur: number,
  outPath: string
): void {
  const clipDur = getVideoDuration(videoFile);
  const needsLoop = clipDur < audioDur;
  const n = title.replace(/'/g, '').replace(/:/g, '\\:');
  const t = tagline.replace(/'/g, '').replace(/:/g, '\\:');

  const inputOpts = needsLoop ? `-stream_loop -1` : '';

  execSync(
    `ffmpeg -y ${inputOpts} -i "${videoFile}" ` +
    `-filter_complex "[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,` +
    `drawbox=x=0:y=${H-110}:w=${W}:h=110:color=black@0.85:t=fill,` +
    `drawbox=x=0:y=${H-110}:w=6:h=110:color=0xf97316@1:t=fill,` +
    `drawtext=text='${n}':fontsize=40:fontcolor=white:` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=28:y=${H-88},` +
    `drawtext=text='${t}':fontsize=24:fontcolor=0xf97316:` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:x=28:y=${H-42},` +
    `fade=in:0:15,fade=out:st=${Math.max(0, audioDur - 0.4)}:d=0.4[v]" ` +
    `-map "[v]" -c:v libx264 -preset fast -crf 20 -r 30 -an -t ${audioDur} "${outPath}"`,
    { stdio: 'pipe' }
  );
}

async function main() {
  if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('\n=== Infection Control v2 — Semantic Clip Mapping ===\n');

  // 1. Generate per-segment audio
  console.log(`Generating ${SEGMENTS.length} audio segments...`);
  const audioPaths: string[] = [];
  const audioDurs: number[] = [];

  for (let i = 0; i < SEGMENTS.length; i++) {
    const seg = SEGMENTS[i];
    const audioPath = path.join(TEMP_DIR, `audio-${String(i).padStart(2,'0')}.mp3`);
    process.stdout.write(`  [${i+1}/${SEGMENTS.length}] TTS...`);
    const dur = await generateAudio(seg.text, audioPath);
    audioPaths.push(audioPath);
    audioDurs.push(dur);
    console.log(` ${dur.toFixed(1)}s — "${seg.title}"`);
  }

  const totalAudio = audioDurs.reduce((a, b) => a + b, 0);
  console.log(`\nTotal audio: ${totalAudio.toFixed(0)}s (${(totalAudio/60).toFixed(1)} min)\n`);

  // 2. Build one video segment per narration segment
  console.log('Building video segments...');
  const segPaths: string[] = [];

  for (let i = 0; i < SEGMENTS.length; i++) {
    const seg = SEGMENTS[i];
    const videoFile = path.join(CLIPS_DIR, seg.clip);
    const segPath = path.join(TEMP_DIR, `seg-${String(i).padStart(2,'0')}.mp4`);

    if (!fs.existsSync(videoFile)) {
      console.error(`  ❌ Missing clip: ${seg.clip}`);
      process.exit(1);
    }

    process.stdout.write(`  [${i+1}/${SEGMENTS.length}] ${seg.clip} → "${seg.title}" (${audioDurs[i].toFixed(1)}s)...`);
    buildSegmentClip(videoFile, seg.title, seg.tagline, audioDurs[i], segPath);
    segPaths.push(segPath);
    console.log(' ✓');
  }

  // 3. Stitch video segments
  process.stdout.write('\nStitching video...');
  const stitched = path.join(TEMP_DIR, 'stitched.mp4');
  const cf = path.join(TEMP_DIR, 'concat.txt');
  fs.writeFileSync(cf, segPaths.map(p => `file '${p}'`).join('\n'));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${cf}" -c copy "${stitched}"`, { stdio: 'pipe' });
  console.log(' ✓');

  // 4. Concatenate audio segments
  process.stdout.write('Joining audio...');
  const audioCf = path.join(TEMP_DIR, 'audio-concat.txt');
  fs.writeFileSync(audioCf, audioPaths.map(p => `file '${p}'`).join('\n'));
  const joinedAudio = path.join(TEMP_DIR, 'narration.mp3');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${audioCf}" -c copy "${joinedAudio}"`, { stdio: 'pipe' });
  console.log(' ✓');

  // 5. Mux video + audio
  process.stdout.write('Muxing...');
  execSync(
    `ffmpeg -y -i "${stitched}" -i "${joinedAudio}" ` +
    `-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 2 ` +
    `-shortest -movflags +faststart "${OUTPUT}"`,
    { stdio: 'pipe' }
  );
  console.log(' ✓');

  // 6. Compress preview copy
  process.stdout.write('Compressing preview...');
  const preview = OUTPUT.replace('.mp4', '-preview.mp4');
  execSync(
    `ffmpeg -y -i "${OUTPUT}" -c:v libx264 -crf 28 -preset fast -vf "scale=1280:720" ` +
    `-c:a aac -b:a 128k -movflags +faststart "${preview}"`,
    { stdio: 'pipe' }
  );
  console.log(' ✓');

  const mb = fs.statSync(OUTPUT).size / 1024 / 1024;
  const prevMb = fs.statSync(preview).size / 1024 / 1024;
  const dur = getVideoDuration(OUTPUT);
  console.log(`\n✅ ${OUTPUT}`);
  console.log(`   Full: ${mb.toFixed(0)}MB | Preview: ${prevMb.toFixed(0)}MB | ${Math.floor(dur/60)}:${String(Math.round(dur%60)).padStart(2,'0')}`);

  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch {}
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
