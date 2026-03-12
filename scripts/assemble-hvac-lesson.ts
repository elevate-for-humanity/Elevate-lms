/**
 * Assembles a single HVAC lesson video from existing assets.
 *
 * Pattern (same as Lesson 5):
 *   [Brandon intro clip]  →  [Diagram + TTS part 1 + labels]  →
 *   [Brandon explain clip] →  [Diagram + TTS part 2 + labels]  →
 *   [Brandon recap clip]  →  [Brandon outro clip]
 *
 * For non-diagram lessons:
 *   [Brandon intro clip]  →  [Title card + TTS + labels]  →
 *   [Brandon recap clip]  →  [Brandon outro clip]
 *
 * All Brandon clips are MOTION VIDEO — full body movement, gestures, speech.
 * They are reused across lessons. TTS audio carries the lesson-specific teaching.
 *
 * Usage:
 *   npx tsx scripts/assemble-hvac-lesson.ts --lesson 10
 *   npx tsx scripts/assemble-hvac-lesson.ts --lesson 10 --dry-run
 *   npx tsx scripts/assemble-hvac-lesson.ts --lesson 10 --force
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(__dirname, '..');
const GEN_DIR = path.join(ROOT, 'temp/generated-lessons');
const CLIPS_DIR = path.join(ROOT, 'temp/lesson5-v10');
const OUT_DIR = path.join(ROOT, 'output/final-lessons');
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

// Brandon motion clips by role
const BRANDON = {
  intro: path.join(CLIPS_DIR, 'v15-intro.mp4'),
  outro: path.join(CLIPS_DIR, 'v15-outro.mp4'),
  recap: path.join(CLIPS_DIR, 'v15-keyterms.mp4'),
  explain: [
    'v15-heat-combustion.mp4', 'v15-heat-exchanger.mp4', 'v15-heat-blower.mp4',
    'v15-heat-pump.mp4', 'v15-cool-compressor.mp4', 'v15-cool-condenser.mp4',
    'v15-cool-txv.mp4', 'v15-cool-evaporator.mp4', 'v15-vent-ducts.mp4', 'v15-vent-fresh.mp4',
  ],
  transition: [
    'v15-cool-overview.mp4', 'v15-vent-exhaust.mp4',
  ],
};

function dur(file: string): number {
  return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`).toString().trim());
}

function safe(text: string): string {
  return text.replace(/[^a-zA-Z0-9 &\-\/\.]/g, '').substring(0, 50);
}

function pickExplain(lessonNum: number): string {
  return path.join(CLIPS_DIR, BRANDON.explain[lessonNum % BRANDON.explain.length]);
}

function pickTransition(lessonNum: number): string {
  return path.join(CLIPS_DIR, BRANDON.transition[lessonNum % BRANDON.transition.length]);
}

/**
 * Build a diagram segment: static diagram image + TTS audio + fade-in labels + title bar.
 * Returns path to the rendered segment mp4.
 */
function buildDiagramSegment(
  diagramPath: string,
  audioPath: string,
  startSec: number,
  endSec: number,
  labels: { text: string; fadeInSec: number }[],
  title: string,
  outPath: string,
): string {
  const segDur = endSec - startSec;

  // Build filter: diagram background + title bar + labels + arrows
  let fc = '';
  fc += `[1:v]scale=820:580[diagram];`;
  fc += `color=c=0x0A1628:s=1280x720:d=${segDur}[bg];`;
  fc += `[0:v]crop=500:720:390:0,scale=350:504[brandon];`;
  fc += `[bg][diagram]overlay=430:80[d1];`;
  fc += `[d1][brandon]overlay=30:130[d2];`;

  // Borders + title
  fc += `[d2]drawbox=x=28:y=128:w=354:h=508:color=white@0.5:t=2,`;
  fc += `drawbox=x=428:y=78:w=824:h=584:color=white@0.3:t=2,`;
  fc += `drawbox=y=0:w=iw:h=65:color=black@0.7:t=fill,`;
  fc += `drawtext=fontfile=${FONT_BOLD}:text='${safe(title)}':fontcolor=white:fontsize=26:x=(w-text_w)/2:y=20,`;
  fc += `drawtext=fontfile=${FONT_BOLD}:text='ELEVATE':fontcolor=white@0.3:fontsize=12:x=1190:y=705,`;
  fc += `drawbox=x=30:y=600:w=350:h=35:color=black@0.7:t=fill,`;
  fc += `drawtext=fontfile=${FONT_REG}:text='Brandon - HVAC Instructor':fontcolor=white@0.9:fontsize=14:x=100:y=608`;

  // Labels with arrows
  labels.forEach((label, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = 460 + col * 380;
    const ly = 110 + row * 80;
    const fadeIn = label.fadeInSec - startSec; // adjust to segment-local time
    const safeLabel = safe(label.text);
    if (fadeIn < 0) return; // label is in the other segment

    const alpha = `if(lt(t,${fadeIn}),0,if(lt(t,${fadeIn}+0.8),min((t-${fadeIn})/0.8\\,1),1))`;

    fc += `,drawbox=x=${lx - 8}:y=${ly - 6}:w=260:h=38:color=black@0.8:t=fill:enable='gte(t,${fadeIn})'`;
    fc += `,drawtext=fontfile=${FONT_BOLD}:text='${safeLabel}':fontcolor=0x00FF88:fontsize=24:x=${lx}:y=${ly}:alpha='${alpha}':enable='gte(t,${fadeIn})'`;

    // Arrow from Brandon area
    const arrowY = ly + 12;
    fc += `,drawbox=x=390:y=${arrowY - 1}:w=${lx - 402}:h=3:color=0x00FF88@0.5:t=fill:enable='gte(t,${fadeIn})'`;
    fc += `,drawbox=x=${lx - 10}:y=${arrowY - 5}:w=6:h=12:color=0x00FF88@0.7:t=fill:enable='gte(t,${fadeIn})'`;
  });

  fc += `[out]`;

  // Use a Brandon explain clip as the PiP presenter (motion, not static)
  // Pick one based on label content
  const presenterClip = pickTransition(labels.length);

  execSync(
    `ffmpeg -y -i "${presenterClip}" -loop 1 -t ${segDur} -i "${diagramPath}" ` +
    `-i "${audioPath}" ` +
    `-filter_complex "${fc}" ` +
    `-map "[out]" -map 2:a -ss ${startSec} -t ${segDur} ` +
    `-c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -shortest ` +
    `"${outPath}" 2>/dev/null`
  );

  return outPath;
}

/**
 * Build a title card segment for non-diagram lessons.
 */
function buildTitleCardSegment(
  audioPath: string,
  labels: { text: string; fadeInSec: number }[],
  title: string,
  outPath: string,
): string {
  const audioDur = dur(audioPath);
  const presenterClip = pickExplain(0);

  let fc = '';
  fc += `[0:v]scale=1280:720,`;
  fc += `drawbox=y=0:w=iw:h=65:color=black@0.7:t=fill,`;
  fc += `drawtext=fontfile=${FONT_BOLD}:text='${safe(title)}':fontcolor=white:fontsize=26:x=(w-text_w)/2:y=20,`;
  fc += `drawtext=fontfile=${FONT_BOLD}:text='ELEVATE':fontcolor=white@0.3:fontsize=12:x=1190:y=705`;

  labels.forEach((label) => {
    const safeLabel = safe(label.text);
    const alpha = `if(lt(t,${label.fadeInSec}),0,if(lt(t,${label.fadeInSec}+0.8),min((t-${label.fadeInSec})/0.8\\,1),1))`;
    fc += `,drawtext=fontfile=${FONT_BOLD}:text='${safeLabel}':fontcolor=0x00FF88:fontsize=28:x=(w-text_w)/2:y=660:alpha='${alpha}':enable='between(t,${label.fadeInSec},${label.fadeInSec + 6})'`;
  });

  fc += `[out]`;

  execSync(
    `ffmpeg -y -i "${presenterClip}" -i "${audioPath}" ` +
    `-filter_complex "${fc}" ` +
    `-map "[out]" -map 1:a ` +
    `-c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -shortest ` +
    `"${outPath}" 2>/dev/null`
  );

  return outPath;
}

/**
 * Normalize a Brandon motion clip to ensure consistent format for concat.
 */
function normalizeClip(input: string, output: string): string {
  if (fs.existsSync(output)) return output;
  execSync(
    `ffmpeg -y -i "${input}" -c:v libx264 -preset fast -crf 22 ` +
    `-vf "scale=1280:720,fps=25" -c:a aac -b:a 128k -ar 44100 -ac 2 ` +
    `"${output}" 2>/dev/null`
  );
  return output;
}

// ── Main ──

function assembleLesson(lessonNumber: number, dryRun: boolean, force: boolean): void {
  const lessonDir = path.join(GEN_DIR, `lesson-${lessonNumber}`);
  const outDir = path.join(OUT_DIR, `lesson-${lessonNumber}`);
  const finalPath = path.join(outDir, 'final.mp4');

  if (fs.existsSync(finalPath) && !force) {
    console.log(`[${lessonNumber}] SKIP — already assembled. Use --force to rebuild.`);
    return;
  }

  if (!fs.existsSync(lessonDir)) {
    console.log(`[${lessonNumber}] ERROR — no generated lesson directory`);
    return;
  }

  const audioPath = path.join(lessonDir, 'audio.mp3');
  const diagramPath = path.join(lessonDir, 'diagram-720.png');
  const contentPath = path.join(lessonDir, 'content.json');

  if (!fs.existsSync(audioPath)) {
    console.log(`[${lessonNumber}] ERROR — missing audio.mp3`);
    return;
  }

  const content = fs.existsSync(contentPath)
    ? JSON.parse(fs.readFileSync(contentPath, 'utf-8'))
    : { labels: [], needsDiagram: false, script: '' };

  const hasDiagram = fs.existsSync(diagramPath) && content.needsDiagram;
  const audioDur = dur(audioPath);
  const title = content.script?.split('.')[0]?.substring(0, 50) || `Lesson ${lessonNumber}`;

  // Assembly plan
  const plan: string[] = [];
  plan.push(`Brandon intro (${dur(BRANDON.intro).toFixed(0)}s)`);
  if (hasDiagram) {
    plan.push(`Diagram + TTS part 1 (${(audioDur / 2).toFixed(0)}s)`);
    plan.push(`Brandon explain (${dur(pickExplain(lessonNumber)).toFixed(0)}s)`);
    plan.push(`Diagram + TTS part 2 (${(audioDur / 2).toFixed(0)}s)`);
  } else {
    plan.push(`Title card + TTS (${audioDur.toFixed(0)}s)`);
  }
  plan.push(`Brandon recap (${dur(BRANDON.recap).toFixed(0)}s)`);
  plan.push(`Brandon outro (${dur(BRANDON.outro).toFixed(0)}s)`);

  console.log(`[${lessonNumber}] ${plan.join(' → ')}`);

  if (dryRun) {
    console.log(`  DRY RUN — would output to ${finalPath}`);
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const tmpDir = path.join(outDir, 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  const segments: string[] = [];

  // 1. Normalize Brandon intro
  const introNorm = path.join(tmpDir, 'intro.mp4');
  normalizeClip(BRANDON.intro, introNorm);
  segments.push(introNorm);

  if (hasDiagram) {
    // 2. Diagram segment part 1 (first half of audio, first 2 labels)
    const halfDur = audioDur / 2;
    const labels1 = (content.labels || []).filter((l: any) => l.fadeInSec < halfDur);
    const diag1 = path.join(tmpDir, 'diagram1.mp4');
    buildDiagramSegment(diagramPath, audioPath, 0, halfDur, labels1, title, diag1);
    // Normalize
    const diag1n = path.join(tmpDir, 'diagram1n.mp4');
    normalizeClip(diag1, diag1n);
    segments.push(diag1n);

    // 3. Brandon explain clip
    const explainNorm = path.join(tmpDir, 'explain.mp4');
    normalizeClip(pickExplain(lessonNumber), explainNorm);
    segments.push(explainNorm);

    // 4. Diagram segment part 2 (second half of audio, remaining labels)
    const labels2 = (content.labels || []).filter((l: any) => l.fadeInSec >= halfDur);
    const diag2 = path.join(tmpDir, 'diagram2.mp4');
    buildDiagramSegment(diagramPath, audioPath, halfDur, audioDur, labels2, title, diag2);
    const diag2n = path.join(tmpDir, 'diagram2n.mp4');
    normalizeClip(diag2, diag2n);
    segments.push(diag2n);
  } else {
    // Title card with full TTS
    const titleCard = path.join(tmpDir, 'titlecard.mp4');
    buildTitleCardSegment(audioPath, content.labels || [], title, titleCard);
    const titleCardN = path.join(tmpDir, 'titlecardn.mp4');
    normalizeClip(titleCard, titleCardN);
    segments.push(titleCardN);
  }

  // 5. Brandon recap
  const recapNorm = path.join(tmpDir, 'recap.mp4');
  normalizeClip(BRANDON.recap, recapNorm);
  segments.push(recapNorm);

  // 6. Brandon outro
  const outroNorm = path.join(tmpDir, 'outro.mp4');
  normalizeClip(BRANDON.outro, outroNorm);
  segments.push(outroNorm);

  // Concatenate all segments
  const concatList = path.join(tmpDir, 'concat.txt');
  fs.writeFileSync(concatList, segments.map(s => `file '${s}'`).join('\n'));

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${finalPath}" 2>/dev/null`
  );

  // Clean up tmp
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Write sources manifest
  const sourcesPath = path.join(outDir, 'sources.json');
  fs.writeFileSync(sourcesPath, JSON.stringify({
    lessonNumber,
    segments: segments.map(s => path.basename(s)),
    hasDiagram,
    audioDuration: audioDur,
    finalDuration: dur(finalPath),
    finalSize: fs.statSync(finalPath).size,
  }, null, 2));

  const finalDur = dur(finalPath);
  const finalSize = (fs.statSync(finalPath).size / 1024 / 1024).toFixed(1);
  console.log(`  ✓ ${finalPath} (${finalDur.toFixed(0)}s, ${finalSize}MB)`);
}

// Parse args
const args = process.argv.slice(2);
let lessonNum: number | null = null;
let dryRun = args.includes('--dry-run');
let force = args.includes('--force');

for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--lesson' || args[i].startsWith('--lesson=')) && !args[i].includes('=')) {
    lessonNum = parseInt(args[i + 1]);
  } else if (args[i].startsWith('--lesson=')) {
    lessonNum = parseInt(args[i].split('=')[1]);
  }
}

if (!lessonNum) {
  console.error('Usage: npx tsx scripts/assemble-hvac-lesson.ts --lesson <number> [--dry-run] [--force]');
  process.exit(1);
}

console.log(`\n=== Assembling Lesson ${lessonNum} ===`);
if (dryRun) console.log('(DRY RUN)\n');
assembleLesson(lessonNum, dryRun, force);
