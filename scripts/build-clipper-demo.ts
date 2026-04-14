/**
 * Clipper Demo Video
 *
 * One continuous voiceover over all clips playing sequentially.
 * Each clip gets a lower-third name + tagline burned in.
 * Single TTS call → stitch clips → mux audio → done.
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import OpenAI from 'openai';

const ROOT      = '/workspaces/Elevate-lms';
const CLIPS_DIR = path.join(ROOT, 'public/videos/barber-clipper-options');
const OUT_DIR   = path.join(ROOT, 'public/videos/barber-lessons');
const TEMP_DIR  = path.join(ROOT, 'temp/clipper-demo');
const OUTPUT    = path.join(OUT_DIR, 'barber-clipper-demo.mp4');
const W = 1920;
const H = 1080;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface ClipDef { file: string; name: string; tagline: string; }

const CLIPS: ClipDef[] = [
  { file: 'lineup-7697544.mp4',  name: "The Barber's Arsenal",  tagline: 'Professional Clipper Overview' },
  { file: 'lineup-7697040.mp4',  name: 'Know Your Tools',       tagline: 'Every clipper has a purpose' },
  { file: 'clip-32000083.mp4',   name: 'Andis Master Clipper',  tagline: 'Corded · Adjustable Blade · Fades and Tapers' },
  { file: 'clip-34039157.mp4',   name: 'Wahl Magic Clip',       tagline: 'Cordless · Zero-Gap · Blending' },
  { file: 'clip-29329449.mp4',   name: 'Oster Classic 76',      tagline: 'Heavy Duty · Detachable Blade · Bulk Removal' },
  { file: 'clip-7697039.mp4',    name: 'T-Outliner Trimmer',    tagline: 'Tight Lines · Edges · Beard Shaping' },
  { file: 'clip-7697089.mp4',    name: 'Wahl Detailer',         tagline: 'Close Detail Work · Sharp T-Blade' },
  { file: 'clip-7686543.mp4',    name: 'Andis Slimline Pro',    tagline: 'Cordless Trimmer · Finishing and Clean-Up' },
  { file: 'clip-4177954.mp4',    name: 'Balding Clipper',       tagline: 'Skin Fades · Close to Scalp' },
  { file: 'clip-4178106.mp4',    name: 'Straight Razor',        tagline: 'Neckline · Edge Definition · Finishing' },
];

const FULL_NARRATION = `Welcome to your clipper training. Every professional barber needs to know their tools inside and out.

These are examples of the types of clippers and trimmers you will encounter and work with in the shop. You bring your own tools as a professional barber, so knowing what each type does will help you choose the right ones for your kit.

First, the Andis Master Clipper. This is the industry standard corded clipper. The adjustable blade takes you from close cuts to longer lengths without swapping guards. This type is your go-to for fades and tapers.

Next, the Wahl Magic Clip. This is an example of a cordless clipper that is zero-gap capable. The taper lever gives you smooth blending transitions, making it a favorite for high-volume fade work.

The Oster Classic 76 represents the heavy-duty detachable blade clipper. Built for serious power and long sessions. Barbers who work high volume rely on this type for bulk removal.

The T-Outliner is an example of a precision trimmer. That T-shaped blade gets into tight spaces, hairlines, edges, around the ears, and beard shaping. You use this type after clipper work to clean everything up.

The Wahl Detailer is another example of a detail trimmer, known for its extremely sharp T-blade. Lightweight and precise, perfect for lining up beards and close edge work.

The Andis Slimline Pro represents the cordless finishing trimmer. Slim and easy to maneuver, you use this type at the end of every cut to clean up the neckline and give the client that polished look.

The balding clipper is designed to cut as close to the scalp as possible. This type is essential for skin fades and bald fades, sitting flush against the skin for a clean smooth finish.

And finally, the straight razor. The mark of a true barber. You use this for the neckline, cleaning up edges, and giving clients that crisp defined finish that clippers alone cannot achieve. Razor technique is tested on the Indiana State Board exam, so make sure you master this tool.

These are the types of tools you will be working with. Know what each one does, choose the right ones for your style, and you will be ready for anything that sits in your chair.`;

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
    `ffmpeg -y -stream_loop -1 -i "${videoFile}" ` +
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

  console.log('\n=== Clipper Demo Video ===\n');

  // 1. Single voiceover
  process.stdout.write('Generating voiceover...');
  const audioPath = path.join(TEMP_DIR, 'narration.mp3');
  const audioDur = await generateAudio(FULL_NARRATION, audioPath);
  console.log(` ${audioDur.toFixed(0)}s`);

  const clipDurEach = audioDur / CLIPS.length;
  console.log(`Each clip: ~${clipDurEach.toFixed(1)}s\n`);

  // 2. Render each clip with lower-third (no audio)
  const segPaths: string[] = [];
  for (let i = 0; i < CLIPS.length; i++) {
    const clip = CLIPS[i];
    const videoFile = path.join(CLIPS_DIR, clip.file);
    if (!fs.existsSync(videoFile)) { console.warn(`⚠️  Missing: ${clip.file}`); continue; }
    process.stdout.write(`[${i+1}/${CLIPS.length}] ${clip.name}...`);
    const segPath = path.join(TEMP_DIR, `seg-${String(i).padStart(2,'0')}.mp4`);
    buildClipWithText(videoFile, clip.name, clip.tagline, clipDurEach, segPath);
    segPaths.push(segPath);
    console.log(' ✓');
  }

  // 3. Concat video
  process.stdout.write('Stitching...');
  const stitched = path.join(TEMP_DIR, 'stitched.mp4');
  const cf = path.join(TEMP_DIR, 'concat.txt');
  fs.writeFileSync(cf, segPaths.map(p => `file '${p}'`).join('\n'));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${cf}" -c copy "${stitched}"`, { stdio: 'pipe' });
  console.log(' ✓');

  // 4. Mux audio
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
