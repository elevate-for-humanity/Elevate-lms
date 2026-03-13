/**
 * Batch assembles lesson videos for all 94 HVAC lessons.
 *
 * Per spec layout for every lesson:
 *   Scene 1 — Instructor Introduction  (first third of audio)
 *   Scene 2 — Diagram Explanation      (second third of audio)
 *   Scene 3 — Key Concept Summary      (final third of audio)
 *
 *   Left:   Instructor avatar (Brandon clip, looped to fill duration)
 *   Right:  Lesson diagram
 *   Bottom: Scene label + lesson title / key concept / quiz question
 *
 * Output: public/hvac/videos/lesson-{uuid}.mp4
 * Skips lessons that already have a video > 500KB.
 *
 * Run: node scripts/batch-assemble-videos.mjs
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const OUT_DIR   = path.join(root, 'public', 'hvac', 'videos');
const AUDIO_DIR = path.join(root, 'public', 'hvac', 'audio');
const DIAG_DIR  = path.join(root, 'public', 'images', 'hvac-diagrams');
const BRANDON   = path.join(root, 'temp', 'heygen-raw', 'a37cb28613da4a68adc47bf14741f54d.mp4');
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG  = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const FFMPEG    = '/usr/bin/ffmpeg';

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Load lesson scripts (defId, uuid, script)
const lessons = JSON.parse(readFileSync(path.join(root, 'data/hvac-lesson-scripts.json'), 'utf8'));

// Load master CSV for diagram, title, key concept, quiz per lesson
function loadCSV() {
  const csv = readFileSync(path.join(root, 'data/hvac-master-curriculum.csv'), 'utf8');
  const lines = csv.trim().split('\n');
  const header = lines[0].split(',');

  function parseRow(line) {
    const cols = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && !inQuote) { inQuote = true; continue; }
      if (c === '"' && inQuote && line[i+1] === '"') { cur += '"'; i++; continue; }
      if (c === '"' && inQuote) { inQuote = false; continue; }
      if (c === ',' && !inQuote) { cols.push(cur); cur = ''; continue; }
      cur += c;
    }
    cols.push(cur);
    return cols;
  }

  const map = {};
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    const id = row[header.indexOf('Lesson_ID')];
    if (!id) continue;
    map[id] = {
      title:      row[header.indexOf('Lesson_Title')],
      module:     row[header.indexOf('Module')],
      diagram:    row[header.indexOf('Diagram_File')],
      keyConcept: row[header.indexOf('Key_Concept')],
      quizQ:      row[header.indexOf('Quiz_Question')],
      quizA:      row[header.indexOf('Quiz_Answer')],
    };
  }
  return map;
}

const csvData = loadCSV();

// Diagram map: defId → diagram filename (fallback to ref-cycle-overview.png)
const DIAGRAM_MAP = {
  'hvac-01-01': 'ref-cycle-overview.png',
  'hvac-01-02': 'ref-cycle-overview.png',
  'hvac-01-03': 'ref-cycle-overview.png',
  'hvac-01-04': 'ref-cycle-overview.png',
  'hvac-02-01': 'ref-cycle-overview.png',
  'hvac-02-02': 'ref-cycle-heat-flow.png',
  'hvac-02-03': 'ref-cycle-overview.png',
  'hvac-02-04': 'safety-equipment.png',
  'hvac-02-05': 'manifold-gauges.png',
  'hvac-03-01': 'multimeter-use.png',
  'hvac-03-02': 'multimeter-use.png',
  'hvac-03-03': 'thermostat-wiring.png',
  'hvac-03-04': 'circuit-breaker.png',
  'hvac-03-05': 'motor-wiring.png',
  'hvac-04-01': 'furnace-operation.png',
  'hvac-04-02': 'heat-exchanger.png',
  'hvac-04-03': 'heat-pump-cycle.png',
  'hvac-04-04': 'furnace-operation.png',
  'hvac-04-05': 'furnace-operation.png',
  'hvac-04-06': 'furnace-operation.png',
  'hvac-05-01': 'ref-cycle-overview.png',
  'hvac-05-02': 'compressor-types.png',
  'hvac-05-03': 'condenser-operation.png',
  'hvac-05-04': 'metering-comparison.png',
  'hvac-05-05': 'evaporator-operation.png',
  'hvac-05-06': 'superheat-subcooling.png',
  'hvac-06-01': 'epa608-overview.png',
  'hvac-06-02': 'refrigerant-types.png',
  'hvac-06-03': 'recovery-process.png',
  'hvac-06-04': 'leak-detection.png',
  'hvac-06-05': 'epa608-overview.png',
  'hvac-06-06': 'recovery-equipment.png',
  'hvac-06-07': 'recovery-process.png',
  'hvac-06-08': 'epa608-overview.png',
  'hvac-07-01': 'epa608-overview.png',
  'hvac-07-02': 'recovery-equipment.png',
  'hvac-07-03': 'recovery-process.png',
  'hvac-07-04': 'epa608-overview.png',
  'hvac-07-05': 'epa608-overview.png',
  'hvac-08-01': 'manifold-gauges.png',
  'hvac-08-02': 'recovery-process.png',
  'hvac-08-03': 'charging-superheat.png',
  'hvac-08-04': 'leak-detection.png',
  'hvac-08-05': 'epa608-overview.png',
  'hvac-08-06': 'recovery-equipment.png',
  'hvac-08-07': 'epa608-overview.png',
  'hvac-09-01': 'epa608-overview.png',
  'hvac-09-02': 'recovery-process.png',
  'hvac-09-03': 'recovery-equipment.png',
  'hvac-09-04': 'epa608-overview.png',
  'hvac-09-05': 'epa608-overview.png',
  'hvac-09-06': 'epa608-overview.png',
  'hvac-10-01': 'duct-system.png',
  'hvac-10-02': 'static-pressure.png',
  'hvac-10-03': 'blower-operation.png',
  'hvac-10-04': 'duct-leakage.png',
  'hvac-10-05': 'filter-types.png',
  'hvac-10-06': 'duct-system.png',
  'hvac-10-07': 'duct-system.png',
  'hvac-11-01': 'thermostat-wiring.png',
  'hvac-11-02': 'contactor-operation.png',
  'hvac-11-03': 'capacitor-types.png',
  'hvac-11-04': 'thermostat-wiring.png',
  'hvac-11-05': 'motor-wiring.png',
  'hvac-12-01': 'heat-pump-cycle.png',
  'hvac-12-02': 'reversing-valve.png',
  'hvac-12-03': 'defrost-cycle.png',
  'hvac-12-04': 'charging-subcooling.png',
  'hvac-12-05': 'heat-pump-cycle.png',
  'hvac-12-06': 'heat-pump-cycle.png',
  'hvac-13-01': 'diagnostic-chart.png',
  'hvac-13-02': 'manifold-gauges.png',
  'hvac-13-03': 'furnace-operation.png',
  'hvac-13-04': 'low-refrigerant.png',
  'hvac-13-05': 'diagnostic-chart.png',
  'hvac-13-06': 'diagnostic-chart.png',
  'hvac-14-01': 'safety-equipment.png',
  'hvac-14-02': 'circuit-breaker.png',
  'hvac-14-03': 'safety-equipment.png',
  'hvac-14-04': 'safety-equipment.png',
  'hvac-14-05': 'safety-equipment.png',
  'hvac-14-06': 'safety-equipment.png',
  'hvac-14-07': 'safety-equipment.png',
  'hvac-14-08': 'safety-equipment.png',
  'hvac-15-01': 'safety-equipment.png',
  'hvac-15-02': 'safety-equipment.png',
  'hvac-15-03': 'ref-cycle-overview.png',
  'hvac-15-04': 'ref-cycle-overview.png',
  'hvac-15-05': 'ref-cycle-overview.png',
  'hvac-16-01': 'epa608-overview.png',
  'hvac-16-02': 'epa608-overview.png',
  'hvac-16-03': 'diagnostic-chart.png',
  'hvac-16-04': 'ref-cycle-overview.png',
  'hvac-16-05': 'ref-cycle-overview.png',
};

function esc(s) {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\u2019')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .slice(0, 72); // truncate for bottom bar
}

function assembleLesson(lesson) {
  const { defId, uuid } = lesson;
  const outPath  = path.join(OUT_DIR, `lesson-${uuid}.mp4`);
  const audioPath = path.join(AUDIO_DIR, `lesson-${uuid}.mp3`);

  // Skip if already assembled
  if (existsSync(outPath) && statSync(outPath).size > 500000) {
    process.stdout.write(`  ⏭  ${defId}\n`);
    return 'skipped';
  }

  if (!existsSync(audioPath)) {
    process.stdout.write(`  ⚠️  ${defId} — no audio, skipping\n`);
    return 'no-audio';
  }

  // Get audio duration via ffprobe
  let audioDur;
  try {
    const r = spawnSync('/usr/bin/ffprobe', [
      '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioPath
    ], { encoding: 'utf8' });
    audioDur = parseFloat(r.stdout.trim());
    if (isNaN(audioDur) || audioDur <= 0) audioDur = 90;
  } catch {
    audioDur = 90;
  }

  const sceneDur  = Math.floor(audioDur / 3);
  const scene3Dur = Math.ceil(audioDur - sceneDur * 2);

  // Get diagram
  const diagFile = DIAGRAM_MAP[defId] || 'ref-cycle-overview.png';
  const diagPath = path.join(DIAG_DIR, diagFile);
  const diagFinal = existsSync(diagPath) ? diagPath : path.join(DIAG_DIR, 'ref-cycle-overview.png');

  // Get lesson metadata
  const meta = csvData[defId] || { title: defId, module: 'HVAC', keyConcept: '', quizQ: '' };

  // Pre-scale diagram to avoid slow PNG decode on every frame
  const scaledDiag = `/tmp/diag_${defId.replace(/-/g,'_')}.jpg`;
  if (!existsSync(scaledDiag)) {
    spawnSync(FFMPEG, [
      '-y', '-i', diagFinal,
      '-vf', 'scale=640:560:force_original_aspect_ratio=decrease,pad=640:560:(ow-iw)/2:(oh-ih)/2:color=0x1e293b',
      scaledDiag
    ], { stdio: 'pipe' });
  }

  const tmpDir = `/tmp/hvac_${defId.replace(/-/g,'_')}`;
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const scenes = [
    {
      file: `${tmpDir}/s1.mp4`,
      ss: 0,
      dur: sceneDur,
      label: 'Scene 1 - Instructor Introduction',
      line2: esc(meta.title),
      line3: esc(meta.module),
    },
    {
      file: `${tmpDir}/s2.mp4`,
      ss: sceneDur,
      dur: sceneDur,
      label: 'Scene 2 - Diagram Explanation',
      line2: esc(meta.title),
      line3: 'Study the diagram as you listen',
    },
    {
      file: `${tmpDir}/s3.mp4`,
      ss: sceneDur * 2,
      dur: scene3Dur,
      label: 'Scene 3 - Key Concept Summary',
      line2: esc(meta.keyConcept),
      line3: esc(meta.quizQ ? 'Quiz: ' + meta.quizQ : ''),
    },
  ];

  for (const scene of scenes) {
    const drawtext = [
      `drawtext=fontfile='${FONT_BOLD}':text='${esc(scene.label)}':fontcolor=0x38bdf8:fontsize=20:x=20:y=572`,
      `drawtext=fontfile='${FONT_BOLD}':text='${scene.line2}':fontcolor=white:fontsize=24:x=20:y=600`,
      scene.line3 ? `drawtext=fontfile='${FONT_REG}':text='${scene.line3}':fontcolor=0x94a3b8:fontsize=18:x=20:y=634` : null,
    ].filter(Boolean).join(',');

    const filter = [
      `[0:v]scale=640:560:force_original_aspect_ratio=decrease,pad=640:560:(ow-iw)/2:(oh-ih)/2:color=0x0f172a,setsar=1[inst]`,
      `[inst][1:v]hstack=inputs=2[top]`,
      `[top]pad=1280:720:0:0:color=0x1e293b[padded]`,
      `[padded]${drawtext}[vout]`,
    ].join(';');

    const result = spawnSync(FFMPEG, [
      '-y',
      '-ss', String(scene.ss), '-t', String(scene.dur), '-i', BRANDON,
      '-loop', '1', '-t', String(scene.dur), '-i', scaledDiag,
      '-filter_complex', filter,
      '-map', '[vout]', '-an',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26',
      scene.file,
    ], { stdio: 'pipe', timeout: 120000 });

    if (result.status !== 0) {
      process.stdout.write(`  ❌ ${defId} scene failed\n`);
      return 'failed';
    }
  }

  // Concat scenes + add audio
  const concatFile = `${tmpDir}/concat.txt`;
  const concatContent = scenes.map(s => `file '${s.file}'`).join('\n');
  writeFileSync(concatFile, concatContent);

  const concatResult = spawnSync(FFMPEG, [
    '-y',
    '-f', 'concat', '-safe', '0', '-i', concatFile,
    '-i', audioPath,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    '-shortest',
    outPath,
  ], { stdio: 'pipe', timeout: 120000 });

  if (concatResult.status !== 0) {
    process.stdout.write(`  ❌ ${defId} concat failed\n`);
    return 'failed';
  }

  const sizeMB = (statSync(outPath).size / 1024 / 1024).toFixed(1);
  process.stdout.write(`  ✅ ${defId} — ${sizeMB}MB (${Math.round(audioDur)}s)\n`);
  return 'assembled';
}

// Run sequentially — ffmpeg is CPU-bound, parallel would thrash
let assembled = 0, skipped = 0, failed = 0, noAudio = 0;

console.log(`\nAssembling videos for ${lessons.length} HVAC lessons...`);
console.log(`Layout: instructor left | diagram right | concept bottom\n`);

for (const lesson of lessons) {
  const result = assembleLesson(lesson);
  if (result === 'assembled') assembled++;
  else if (result === 'skipped') skipped++;
  else if (result === 'no-audio') noAudio++;
  else failed++;
}

console.log(`\n✅ Done: ${assembled} assembled, ${skipped} skipped, ${noAudio} no-audio, ${failed} failed`);
