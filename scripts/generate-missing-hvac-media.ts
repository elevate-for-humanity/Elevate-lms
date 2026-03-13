/**
 * Generate only missing HVAC media using existing repo tools.
 *
 * Rules:
 *   - No placeholder audio. No fake videos. No random UUIDs.
 *   - UUIDs are deterministic (SHA-1 of "hvac:{lessonId}") and stored in hvac-uuids.ts.
 *   - CSV is updated only after real files are verified on disk.
 *   - Rerunning skips lessons whose files already exist.
 *
 * Run:
 *   pnpm tsx scripts/generate-missing-hvac-media.ts
 *
 * Targets (lessons with no Video_File in CSV):
 *   hvac-06-09, hvac-06-10, hvac-06-11, hvac-06-12
 *
 * Calls:
 *   pnpm tsx scripts/generate-hvac-audio.ts --lesson-id <id> --out <path>
 *   pnpm tsx scripts/generate-hvac-videos-did.ts --lesson-id <id> --audio <path> --out <path>
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';

const ROOT        = process.cwd();
const CSV_PATH    = path.join(ROOT, 'data', 'hvac-master-curriculum.csv');
const AUDIO_DIR   = path.join(ROOT, 'public', 'hvac', 'audio');
const VIDEO_DIR   = path.join(ROOT, 'public', 'hvac', 'videos');
const CAPTION_DIR = path.join(ROOT, 'public', 'hvac', 'captions');

// Only generate these four — the rest already have media.
const TARGET_IDS = new Set(['hvac-06-09', 'hvac-06-10', 'hvac-06-11', 'hvac-06-12']);

// ── Deterministic UUID from lesson ID ────────────────────────────────────────
// SHA-1 of "hvac:{lessonId}" formatted as UUID v5-style.
// Must match the values added to lib/courses/hvac-uuids.ts.
function stableUuid(lessonId: string): string {
  const hex = createHash('sha1').update(`hvac:${lessonId}`).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '5' + hex.slice(13, 16),
    'a' + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

// ── RFC 4180 CSV parser ───────────────────────────────────────────────────────
type Row = Record<string, string>;

function parseCSV(raw: string): { headers: string[]; rows: Row[] } {
  const records: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const next = raw[i + 1];
    if (inQuote) {
      if (c === '"' && next === '"') { cur += '"'; i++; continue; }
      if (c === '"') { inQuote = false; continue; }
      cur += c; continue;
    }
    if (c === '"') { inQuote = true; continue; }
    if (c === ',') { row.push(cur); cur = ''; continue; }
    if (c === '\r' && next === '\n') { row.push(cur); records.push(row); row = []; cur = ''; i++; continue; }
    if (c === '\n') { row.push(cur); records.push(row); row = []; cur = ''; continue; }
    cur += c;
  }
  if (cur.length || row.length) { row.push(cur); records.push(row); }

  const headers = records[0];
  const rows = records.slice(1)
    .filter(r => r.length === headers.length && r[0])
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
  return { headers, rows };
}

function serializeCSV(headers: string[], rows: Row[]): string {
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [
    headers.map(esc).join(','),
    ...rows.map(r => headers.map(h => esc(r[h] ?? '')).join(',')),
  ].join('\r\n') + '\r\n';
}

// ── VTT caption generator ─────────────────────────────────────────────────────
function buildVTT(scriptText: string, totalSeconds: number): string {
  const paras = scriptText.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  if (!paras.length) return 'WEBVTT\n\n';
  const secPer = totalSeconds / paras.length;
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toFixed(3).padStart(6, '0');
    return `${h}:${m}:${sec}`;
  };
  let out = 'WEBVTT\n\n';
  paras.forEach((para, i) => {
    const start = i * secPer;
    const end = Math.min((i + 1) * secPer, totalSeconds);
    const words = para.split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (candidate.length > 80) { if (line) lines.push(line); line = w; }
      else line = candidate;
    }
    if (line) lines.push(line);
    out += `${fmt(start)} --> ${fmt(end)}\n${lines.slice(0, 3).join('\n')}\n\n`;
  });
  return out;
}

// ── Shell runner ──────────────────────────────────────────────────────────────
function run(args: string[]): void {
  const result = spawnSync('pnpm', args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env },
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: pnpm ${args.join(' ')}`);
  }
}

function fileExists(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isFile() && fs.statSync(p).size > 0;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main(): void {
  for (const d of [AUDIO_DIR, VIDEO_DIR, CAPTION_DIR]) {
    fs.mkdirSync(d, { recursive: true });
  }

  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const { headers, rows } = parseCSV(raw);

  const targets = rows.filter(r => TARGET_IDS.has(r['Lesson_ID']));
  if (targets.length !== TARGET_IDS.size) {
    throw new Error(`Expected ${TARGET_IDS.size} target lessons in CSV, found ${targets.length}`);
  }

  let anyFailed = false;

  for (const lesson of targets) {
    const lessonId = lesson['Lesson_ID'];
    const uuid     = stableUuid(lessonId);

    const audioRel   = `hvac/audio/lesson-${uuid}.mp3`;
    const videoRel   = `hvac/videos/lesson-${uuid}.mp4`;
    const captionRel = `hvac/captions/lesson-${uuid}.vtt`;

    const audioAbs   = path.join(ROOT, 'public', audioRel);
    const videoAbs   = path.join(ROOT, 'public', videoRel);
    const captionAbs = path.join(ROOT, 'public', captionRel);

    console.log(`\n=== ${lessonId} (${uuid}) ===`);

    // ── Audio ──
    if (fileExists(audioAbs)) {
      console.log(`  audio: exists — skip`);
    } else {
      console.log(`  audio: generating...`);
      try {
        run(['tsx', 'scripts/generate-hvac-audio.ts', '--lesson-id', lessonId, '--out', audioAbs]);
      } catch (e: any) {
        console.error(`  audio FAILED: ${e.message}`);
        anyFailed = true;
        continue;
      }
    }

    if (!fileExists(audioAbs)) {
      console.error(`  audio not found after generation: ${audioRel}`);
      anyFailed = true;
      continue;
    }

    // ── Video ──
    if (fileExists(videoAbs)) {
      console.log(`  video: exists — skip`);
    } else {
      console.log(`  video: generating...`);
      try {
        run(['tsx', 'scripts/generate-hvac-videos-did.ts', '--lesson-id', lessonId, '--audio', audioAbs, '--out', videoAbs]);
      } catch (e: any) {
        console.error(`  video FAILED: ${e.message}`);
        anyFailed = true;
        continue;
      }
    }

    if (!fileExists(videoAbs)) {
      console.error(`  video not found after generation: ${videoRel}`);
      anyFailed = true;
      continue;
    }

    // ── Captions ──
    if (fileExists(captionAbs)) {
      console.log(`  captions: exists — skip`);
    } else {
      const minutes = Number(lesson['Lesson_Duration_Min'] || '3');
      const vtt = buildVTT(lesson['Script_Text'] || lesson['Lesson_Title'], minutes * 60);
      fs.writeFileSync(captionAbs, vtt, 'utf8');
      console.log(`  captions: generated`);
    }

    // ── Update CSV only after all three files verified ──
    lesson['Audio_File'] = audioRel;
    lesson['Video_File'] = videoRel;
    console.log(`  CSV: updated`);
  }

  // Write CSV once at the end — only rows that succeeded have updated paths
  fs.writeFileSync(CSV_PATH, serializeCSV(headers, rows), 'utf8');
  console.log('\nCSV written.');

  if (anyFailed) {
    console.error('\nSome lessons failed. Re-run to retry.');
    process.exit(1);
  }

  console.log('\nDone. All target lessons have audio, video, and captions.');
  console.log('Commit public/hvac/ and data/hvac-master-curriculum.csv when verified.');
}

main();
