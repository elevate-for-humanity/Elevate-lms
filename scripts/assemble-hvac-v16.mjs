/**
 * HVAC Lesson Video Assembler — V16 Composite Style
 *
 * Matches the approved V16b reference layout:
 *   - 1280x720 dark navy canvas (#0A1628)
 *   - Brandon PiP left (350x504, white border, name tag)
 *   - HVAC diagram right (820x580)
 *   - Title bar top 65px
 *   - Fade-in key term labels on diagram side with arrows
 *   - ELEVATE FOR HUMANITY branding bottom-right
 *   - Marcus MP3 audio (Brandon clip muted)
 *   - H.264 Baseline profile — plays on all mobile browsers
 *
 * Usage:
 *   node scripts/assemble-hvac-v16.mjs --lesson 1
 *   node scripts/assemble-hvac-v16.mjs --all
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';

// Load env
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';

// Fonts
const FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

// Layout constants (match V16b)
const W = 1280, H = 720;
const BG = '0A1628';
const GREEN = '00FF88';

// Brandon PiP
const PIP_W = 350, PIP_H = 504;
const PIP_X = 30, PIP_Y = 130;
const PIP_CROP_W = 500; // crop center 500px from 1920px wide clip

// Diagram
const DIAG_W = 820, DIAG_H = 580;
const DIAG_X = 430, DIAG_Y = 80;

// Title bar
const TITLE_H = 65;

// Label columns on diagram side
const LABEL_W = 260, LABEL_H = 44;
const LABEL_COL1_X = 450, LABEL_COL2_X = 730;
const LABEL_START_Y = 110;
const LABEL_SPACING = 80;

// Arrow origin (Brandon's right edge)
const ARROW_X = PIP_X + PIP_W + 5; // 385

function esc(s) {
  return String(s)
    .replace(/\\/g, '')
    .replace(/'/g, '\u2019')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/"/g, '')
    .replace(/%/g, ' pct');
}

function probeDuration(filePath) {
  const r = spawnSync('ffprobe', [
    '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', filePath,
  ]);
  return parseFloat(r.stdout?.toString().trim()) || 90;
}

// Fetch lesson data from DB
async function fetchLessons(lessonNumbers) {
  const filter = lessonNumbers
    ? `lesson_number=in.(${lessonNumbers.join(',')})&`
    : '';
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id_uuid=eq.${HVAC_COURSE_ID}&${filter}select=lesson_number,title,id&order=lesson_number`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const rows = await res.json();
  const map = {};
  for (const r of rows) map[r.lesson_number] = { title: r.title, id: r.id };
  return map;
}

// Read key terms from hvac-lesson-content.ts source (parse at runtime)
function getKeyTerms(defId) {
  try {
    const src = fs.readFileSync('lib/courses/hvac-lesson-content.ts', 'utf8');
    const idx = src.indexOf(`'${defId}'`);
    if (idx === -1) return [];
    const chunk = src.slice(idx, idx + 3000);
    const termsStart = chunk.indexOf('keyTerms:');
    if (termsStart === -1) return [];
    const termsEnd = chunk.indexOf('],', termsStart);
    const termsBlock = chunk.slice(termsStart, termsEnd + 2);
    // Extract term strings
    const terms = [];
    const re = /term:\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(termsBlock)) !== null) {
      terms.push(m[1]);
    }
    return terms.slice(0, 5);
  } catch {
    return [];
  }
}

// Build FFmpeg filter_complex for V16 layout
function buildFilterComplex(lessonNum, title, keyTerms, audioDur) {
  const safeTitle = esc(title);
  const lessonLabel = `Lesson ${lessonNum}`;

  const filters = [];

  // 1. Dark navy background canvas
  filters.push(`color=c=#${BG}:s=${W}x${H}:r=25[bg]`);

  // 2. Brandon PiP: crop center 500px from 1920-wide clip, scale to 350x504
  const cropX = Math.round((1920 - PIP_CROP_W) / 2);
  filters.push(
    `[0:v]crop=${PIP_CROP_W}:1080:${cropX}:0,scale=${PIP_W}:${PIP_H}:force_original_aspect_ratio=increase,crop=${PIP_W}:${PIP_H},setsar=1[pip]`
  );

  // 3. Overlay Brandon on canvas
  filters.push(`[bg][pip]overlay=x=${PIP_X}:y=${PIP_Y}[withpip]`);

  // 4. White border around PiP
  filters.push(
    `[withpip]drawbox=x=${PIP_X - 2}:y=${PIP_Y - 2}:w=${PIP_W + 4}:h=${PIP_H + 4}:color=white@1.0:t=2[pipborder]`
  );

  // 5. Diagram: scale to 820x580, overlay at (430, 80)
  filters.push(
    `[1:v]scale=${DIAG_W}:${DIAG_H}:force_original_aspect_ratio=increase,crop=${DIAG_W}:${DIAG_H},setsar=1[diag]`
  );
  filters.push(`[pipborder][diag]overlay=x=${DIAG_X}:y=${DIAG_Y}[withdiag]`);

  // 6. Slate border around diagram
  filters.push(
    `[withdiag]drawbox=x=${DIAG_X - 1}:y=${DIAG_Y - 1}:w=${DIAG_W + 2}:h=${DIAG_H + 2}:color=#334155@1.0:t=1[diagborder]`
  );

  // 7. Title bar: dark overlay top 65px
  filters.push(
    `[diagborder]drawbox=x=0:y=0:w=${W}:h=${TITLE_H}:color=black@0.85:t=fill[titlebar]`
  );

  // 8. "Lesson N" left in green
  filters.push(
    `[titlebar]drawtext=text='${esc(lessonLabel)}':fontcolor=#${GREEN}:fontsize=16:x=20:y=24:fontfile=${FB}[withlabel]`
  );

  // 9. Lesson title centered in white
  filters.push(
    `[withlabel]drawtext=text='${safeTitle}':fontcolor=white:fontsize=22:x=(${W}-text_w)/2:y=20:fontfile=${FB}[withtitle]`
  );

  // 10. Name tag below Brandon PiP
  const nameTagY = PIP_Y + PIP_H + 8;
  filters.push(
    `[withtitle]drawtext=text='Brandon \\u2014 HVAC Instructor':fontcolor=white:fontsize=14:x=${PIP_X}:y=${nameTagY}:fontfile=${FR}[withnametag]`
  );

  // 11. ELEVATE branding bottom-right
  filters.push(
    `[withnametag]drawtext=text='ELEVATE FOR HUMANITY':fontcolor=#${GREEN}:fontsize=14:x=1060:y=698:fontfile=${FR}[withbrand]`
  );

  // 12. Fade-in labels + arrows for each key term
  let current = 'withbrand';
  const fadeIn = 0.5;

  keyTerms.forEach((term, i) => {
    const col = i % 2; // 0 = left col, 1 = right col
    const row = Math.floor(i / 2);
    const lx = col === 0 ? LABEL_COL1_X : LABEL_COL2_X;
    const ly = LABEL_START_Y + row * LABEL_SPACING;

    // Evenly distribute across audio duration
    const interval = audioDur / (keyTerms.length + 1);
    const startT = interval * (i + 1);
    const endT = audioDur;

    const alphaExpr = `if(between(t,${startT.toFixed(1)},${(startT + fadeIn).toFixed(1)}),(t-${startT.toFixed(1)})/${fadeIn},1)`;
    const enableExpr = `between(t,${startT.toFixed(1)},${endT.toFixed(1)})`;

    const outBox = `lbox${i}`;
    const outText = `ltxt${i}`;
    const outArrow = `larr${i}`;

    // Pill background
    filters.push(
      `[${current}]drawbox=x=${lx}:y=${ly}:w=${LABEL_W}:h=${LABEL_H}:color=black@0.80:t=fill:enable='${enableExpr}'[${outBox}]`
    );

    // Label text
    filters.push(
      `[${outBox}]drawtext=text='${esc(term)}':fontcolor=#${GREEN}:fontsize=20:fontfile=${FB}:x=${lx + 8}:y=${ly + 12}:alpha='${alphaExpr}':enable='${enableExpr}'[${outText}]`
    );

    // Arrow: horizontal line from Brandon edge to pill
    const arrowY = ly + Math.floor(LABEL_H / 2);
    filters.push(
      `[${outText}]drawbox=x=${ARROW_X}:y=${arrowY - 1}:w=${lx - ARROW_X}:h=2:color=#${GREEN}@0.9:t=fill:enable='${enableExpr}'[${outArrow}]`
    );

    current = outArrow;
  });

  filters.push(`[${current}]null[out]`);

  return filters.join(';');
}

async function assembleLesson(lessonNum, lessonData, manifest) {
  const entry = manifest.find(x => x.lessonNumber === lessonNum);
  if (!entry) {
    console.error(`No manifest entry for lesson ${lessonNum}`);
    return null;
  }

  const { mp3Path, brandonClip, diagramBackground } = entry;

  if (!mp3Path || !fs.existsSync(mp3Path)) {
    console.error(`  SKIP lesson ${lessonNum} — missing MP3: ${mp3Path}`);
    return null;
  }
  if (!brandonClip || !fs.existsSync(brandonClip)) {
    console.error(`  SKIP lesson ${lessonNum} — missing Brandon clip: ${brandonClip}`);
    return null;
  }
  if (!diagramBackground || !fs.existsSync(diagramBackground)) {
    console.error(`  SKIP lesson ${lessonNum} — missing diagram: ${diagramBackground}`);
    return null;
  }

  const outDir = 'temp/assembled';
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `hvac-lesson-${String(lessonNum).padStart(3, '0')}-v16.mp4`);

  if (fs.existsSync(outPath)) {
    console.log(`  SKIP lesson ${lessonNum} — already assembled`);
    return outPath;
  }

  const title = lessonData?.title || `Lesson ${lessonNum}`;
  const defId = entry.defId;
  const keyTerms = defId ? getKeyTerms(defId) : [];
  const audioDur = probeDuration(mp3Path);

  console.log(`  Building lesson ${lessonNum}: "${title}" (${Math.round(audioDur)}s, ${keyTerms.length} labels)`);

  const filterComplex = buildFilterComplex(lessonNum, title, keyTerms, audioDur);

  const cmd = [
    'ffmpeg', '-y',
    '-stream_loop', '-1', '-i', brandonClip,   // [0:v] Brandon (looped)
    '-loop', '1', '-i', diagramBackground,      // [1:v] Diagram (static)
    '-i', mp3Path,                              // [2:a] Marcus audio
    '-filter_complex', filterComplex,
    '-map', '[out]',
    '-map', '2:a',
    '-t', String(audioDur),
    '-c:v', 'libx264',
    '-profile:v', 'baseline',
    '-level', '3.1',
    '-preset', 'medium',
    '-crf', '22',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-movflags', '+faststart',
    outPath,
  ];

  const result = spawnSync(cmd[0], cmd.slice(1), {
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() || '';
    console.error(`  FFmpeg failed for lesson ${lessonNum}:`);
    console.error(stderr.slice(-800));
    return null;
  }

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`  ✅ Built: ${outPath} (${sizeMB}MB)`);
  return outPath;
}

async function uploadAndUpdateDB(lessonNum, localPath) {
  const key = `hvac/hvac-lesson-${String(lessonNum).padStart(3, '0')}-v16.mp4`;
  const buf = fs.readFileSync(localPath);

  console.log(`  Uploading ${(buf.length / 1024 / 1024).toFixed(1)}MB to Supabase...`);
  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/media/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'video/mp4',
      'x-upsert': 'true',
    },
    body: buf,
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.Key) {
    console.error('  Upload failed:', JSON.stringify(uploadData));
    return null;
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/media/${key}`;

  // Update DB video_url
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/training_lessons?course_id_uuid=eq.${HVAC_COURSE_ID}&lesson_number=eq.${lessonNum}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ video_url: publicUrl }),
    }
  );

  if (!updateRes.ok) {
    console.error('  DB update failed:', updateRes.status);
    return null;
  }

  console.log(`  ✅ Uploaded + DB updated: ${publicUrl}`);
  return publicUrl;
}

// ── Main ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const lessonArg = args.indexOf('--lesson');
const allArg = args.includes('--all');

if (!lessonArg && !allArg && args.indexOf('--lesson') === -1) {
  console.error('Usage: node scripts/assemble-hvac-v16.mjs --lesson 1');
  console.error('       node scripts/assemble-hvac-v16.mjs --all');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync('data/hvac-lesson-manifest.json', 'utf8'));

let lessonNumbers;
if (allArg) {
  lessonNumbers = manifest.map(x => x.lessonNumber).filter(Boolean);
} else {
  const n = parseInt(args[lessonArg + 1], 10);
  if (isNaN(n)) { console.error('Invalid lesson number'); process.exit(1); }
  lessonNumbers = [n];
}

console.log(`\n=== HVAC V16 Assembler — ${lessonNumbers.length} lesson(s) ===\n`);

const lessonData = await fetchLessons(lessonNumbers);

let built = 0, failed = 0;
for (const num of lessonNumbers) {
  console.log(`\nLesson ${num}:`);
  const localPath = await assembleLesson(num, lessonData[num], manifest);
  if (!localPath) { failed++; continue; }

  const url = await uploadAndUpdateDB(num, localPath);
  if (url) {
    built++;
    console.log(`\n  Watch: ${url}`);
  } else {
    failed++;
  }
}

console.log(`\n=== Done: ${built} built, ${failed} failed ===`);
