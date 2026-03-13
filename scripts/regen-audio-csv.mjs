/**
 * Regenerate HVAC lesson audio using exact filenames from the CSV.
 * Voice: echo on gpt-4o-mini-tts — no tts-1-hd fallback.
 * Skips files that already exist and are > 50KB.
 * Reads scripts from data/hvac-lesson-scripts.json (keyed by defId).
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
dotenv.config({ path: path.join(root, '.env.local'), override: false });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const MARCUS_INSTRUCTION =
  'Speak as Marcus Johnson — a licensed master electrician and HVAC technician ' +
  'with 20 years of field experience. Your tone is direct, confident, and practical. ' +
  'You speak like a tradesman who has seen everything in the field, not like a textbook. ' +
  'Pace yourself clearly — students are taking notes. Emphasize key numbers and safety warnings. ' +
  'Pause naturally between concepts.';

// Parse CSV (RFC 4180 — handles quoted fields with embedded newlines)
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  // Skip header row
  let headers = [];
  let inHeader = true;

  while (i < len) {
    const row = [];
    while (i < len) {
      if (text[i] === '"') {
        // Quoted field
        i++;
        let field = '';
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else {
            field += text[i++];
          }
        }
        row.push(field);
      } else {
        let field = '';
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i++];
        }
        row.push(field.trim());
      }
      if (i < len && text[i] === ',') { i++; continue; }
      if (i < len && (text[i] === '\n' || text[i] === '\r')) {
        if (text[i] === '\r' && text[i + 1] === '\n') i++;
        i++;
        break;
      }
      break;
    }
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
    if (inHeader) { headers = row; inHeader = false; }
    else {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = row[idx] ?? ''; });
      rows.push(obj);
    }
  }
  return rows;
}

// Load CSV
const csvText = readFileSync(path.join(root, 'data/hvac-master-curriculum.csv'), 'utf8');
const csvRows = parseCSV(csvText).filter(r => r.Lesson_ID?.startsWith('hvac-'));

// Load scripts (keyed by defId)
const scripts = {};
const scriptData = JSON.parse(readFileSync(path.join(root, 'data/hvac-lesson-scripts.json'), 'utf8'));
for (const entry of scriptData) {
  scripts[entry.defId] = entry.script;
}

// Build work list: { lessonId, outPath, script }
const work = [];
for (const row of csvRows) {
  const lessonId = row.Lesson_ID.trim();
  const audioFile = row.Audio_File.trim(); // e.g. hvac/audio/lesson-xxxx.mp3
  const outPath = path.join(root, 'public', audioFile);
  const script = scripts[lessonId];

  if (!script) {
    console.warn(`  ⚠  No script for ${lessonId} — skipping`);
    continue;
  }

  if (existsSync(outPath)) {
    const size = readFileSync(outPath).length;
    if (size > 50000) {
      console.log(`  ⏭  ${lessonId} — exists (${(size/1024).toFixed(0)}KB)`);
      continue;
    }
    console.log(`  ♻  ${lessonId} — exists but tiny (${size}B), regenerating`);
  }

  work.push({ lessonId, outPath, script });
}

console.log(`\nGenerating ${work.length} audio files...\n`);

if (work.length === 0) {
  console.log('All files present. Done.');
  process.exit(0);
}

// Ensure output dir exists
mkdirSync(path.join(root, 'public/hvac/audio'), { recursive: true });

function generateOne(item) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'echo',
      input: item.script,
      instructions: MARCUS_INSTRUCTION,
    });

    const attempt = (retries = 3) => {
      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/audio/speech',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        if (res.statusCode === 429) {
          const wait = 30000;
          console.log(`  ⏳ Rate limited on ${item.lessonId} — waiting ${wait/1000}s`);
          setTimeout(() => attempt(retries - 1), wait);
          return;
        }
        if (res.statusCode !== 200) {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => {
            const msg = Buffer.concat(chunks).toString().slice(0, 200);
            if (retries > 0) {
              console.warn(`  ⚠  ${item.lessonId} HTTP ${res.statusCode} — retrying. ${msg}`);
              setTimeout(() => attempt(retries - 1), 5000);
            } else {
              console.error(`  ❌ ${item.lessonId} failed: ${res.statusCode} ${msg}`);
              resolve('failed');
            }
          });
          return;
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          writeFileSync(item.outPath, buf);
          console.log(`  ✅ ${item.lessonId} — ${(buf.length/1024).toFixed(0)}KB`);
          resolve('ok');
        });
      });
      req.on('error', (e) => {
        if (retries > 0) {
          console.warn(`  ⚠  ${item.lessonId} network error — retrying: ${e.message}`);
          setTimeout(() => attempt(retries - 1), 5000);
        } else {
          console.error(`  ❌ ${item.lessonId} network error: ${e.message}`);
          resolve('failed');
        }
      });
      req.write(body);
      req.end();
    };

    attempt();
  });
}

// Process 3 at a time
const CONCURRENCY = 3;
let ok = 0, failed = 0;

for (let i = 0; i < work.length; i += CONCURRENCY) {
  const batch = work.slice(i, i + CONCURRENCY);
  const results = await Promise.all(batch.map(generateOne));
  for (const r of results) {
    if (r === 'ok') ok++;
    else failed++;
  }
  // Brief pause between batches
  if (i + CONCURRENCY < work.length) {
    await new Promise(r => setTimeout(r, 1000));
  }
}

console.log(`\nDone. Generated: ${ok}  Failed: ${failed}`);
if (failed > 0) process.exit(1);
