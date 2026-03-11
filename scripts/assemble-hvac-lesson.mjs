/**
 * Assemble one HVAC lesson video:
 *   - Brandon clip (left 50%, looped to match audio duration)
 *   - Diagram background image (right 50%)
 *   - Lesson MP3 audio (replaces Brandon's original audio)
 *   - Lesson title text overlay (top bar)
 *   - Captions: white text on dark band, bottom of screen, NO overlap
 *
 * Usage: node scripts/assemble-hvac-lesson.mjs <lessonNumber>
 *        node scripts/assemble-hvac-lesson.mjs all
 */

import fs from 'fs';
import { execSync, spawnSync } from 'child_process';
import path from 'path';

const manifest = JSON.parse(fs.readFileSync('data/hvac-lesson-manifest.json', 'utf8'));

// Fetch lesson titles from DB
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getLessonTitles() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id_uuid=eq.f0593164-55be-5867-98e7-8a86770a8dd0&select=lesson_number,title&order=lesson_number`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const rows = await res.json();
  const map = {};
  for (const r of rows) map[r.lesson_number] = r.title;
  return map;
}

function getAudioDuration(mp3Path) {
  const result = spawnSync('ffprobe', [
    '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3Path
  ]);
  return parseFloat(result.stdout.toString().trim()) || 90;
}

function assembleLesson(lesson, title) {
  const { lessonNumber, mp3Path, brandonClip, diagramBackground, outputPath } = lesson;

  if (!mp3Path) {
    console.log(`  SKIP lesson ${lessonNumber} — no audio`);
    return false;
  }
  if (fs.existsSync(outputPath)) {
    console.log(`  SKIP lesson ${lessonNumber} — already assembled`);
    return true;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const audioDur = getAudioDuration(mp3Path);
  const safeTitle = (title || `Lesson ${lessonNumber}`).replace(/'/g, "\\'").replace(/:/g, '\\:');
  const lessonLabel = `Lesson ${lessonNumber}`;

  // Layout: 1280x720
  // Left half (0-640): Brandon looped, cropped to 640x720
  // Right half (640-1280): diagram background, scaled to 640x720
  // Top bar: dark overlay + lesson number + title
  // Bottom: caption band (fixed height, no overlap)

  // Check if diagram exists, use solid color fallback
  const hasDiag = diagramBackground && fs.existsSync(diagramBackground);

  let filterComplex;
  if (hasDiag) {
    filterComplex = [
      // Scale Brandon to 640x720, loop to audio duration
      `[0:v]scale=640:720:force_original_aspect_ratio=increase,crop=640:720,setsar=1[brandon]`,
      // Scale diagram to 640x720
      `[1:v]scale=640:720:force_original_aspect_ratio=increase,crop=640:720,setsar=1[diag]`,
      // Stack side by side
      `[brandon][diag]hstack=inputs=2[base]`,
      // Dark top bar
      `[base]drawbox=x=0:y=0:w=1280:h=60:color=black@0.75:t=fill[withbar]`,
      // Lesson number (left of bar)
      `[withbar]drawtext=text='${lessonLabel}':fontcolor=white:fontsize=20:x=20:y=20:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf[withlabel]`,
      // Title (center of bar) - truncated to avoid overflow
      `[withlabel]drawtext=text='${safeTitle}':fontcolor=#93c5fd:fontsize=18:x=(1280-text_w)/2:y=22:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf[withtitle]`,
      // Caption band at bottom - fixed 50px band, text centered within it (NO overlap)
      `[withtitle]drawbox=x=0:y=670:w=1280:h=50:color=black@0.85:t=fill[withcaptionbg]`,
      `[withcaptionbg]drawtext=text='elevateforhumanity.org':fontcolor=#4ade80:fontsize=16:x=(1280-text_w)/2:y=685:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf[out]`,
    ].join(';');
  } else {
    // No diagram - use solid dark background on right
    filterComplex = [
      `[0:v]scale=640:720:force_original_aspect_ratio=increase,crop=640:720,setsar=1[brandon]`,
      `color=c=#1e293b:s=640x720[bg]`,
      `[brandon][bg]hstack=inputs=2[base]`,
      `[base]drawbox=x=0:y=0:w=1280:h=60:color=black@0.75:t=fill[withbar]`,
      `[withbar]drawtext=text='${lessonLabel}':fontcolor=white:fontsize=20:x=20:y=20:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf[withlabel]`,
      `[withlabel]drawtext=text='${safeTitle}':fontcolor=#93c5fd:fontsize=18:x=(1280-text_w)/2:y=22:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf[withtitle]`,
      `[withtitle]drawbox=x=0:y=670:w=1280:h=50:color=black@0.85:t=fill[withcaptionbg]`,
      `[withcaptionbg]drawtext=text='elevateforhumanity.org':fontcolor=#4ade80:fontsize=16:x=(1280-text_w)/2:y=685:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf[out]`,
    ].join(';');
  }

  const inputs = hasDiag
    ? ['-stream_loop', '-1', '-i', brandonClip, '-i', diagramBackground, '-i', mp3Path]
    : ['-stream_loop', '-1', '-i', brandonClip, '-i', mp3Path];

  // Adjust audio input index based on whether we have diagram
  const audioMap = hasDiag ? '2:a' : '1:a';

  const cmd = [
    'ffmpeg', '-y',
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[out]',
    '-map', audioMap,
    '-t', String(audioDur),
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    outputPath
  ];

  console.log(`  Assembling lesson ${lessonNumber}: "${title}" (${audioDur.toFixed(0)}s)...`);
  const result = spawnSync(cmd[0], cmd.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] });

  if (result.status !== 0) {
    console.error(`  FAILED lesson ${lessonNumber}:`, result.stderr?.toString().slice(-200));
    return false;
  }

  const size = Math.round(fs.statSync(outputPath).size / 1024 / 1024);
  console.log(`  ✅ Lesson ${lessonNumber} done — ${size}MB → ${outputPath}`);
  return true;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) { console.error('Usage: node scripts/assemble-hvac-lesson.mjs <lessonNumber|all>'); process.exit(1); }

  console.log('Fetching lesson titles...');
  const titles = await getLessonTitles();

  if (arg === 'all') {
    let done = 0, failed = 0, skipped = 0;
    for (const lesson of manifest) {
      if (lesson.status !== 'ready') { skipped++; continue; }
      const ok = assembleLesson(lesson, titles[lesson.lessonNumber] || `Lesson ${lesson.lessonNumber}`);
      if (ok) done++; else failed++;
    }
    console.log(`\nDone: ${done} | Failed: ${failed} | Skipped: ${skipped}`);
  } else {
    const num = parseInt(arg);
    const lesson = manifest.find(l => l.lessonNumber === num);
    if (!lesson) { console.error(`Lesson ${num} not found`); process.exit(1); }
    assembleLesson(lesson, titles[num] || `Lesson ${num}`);
  }
}

main().catch(console.error);
