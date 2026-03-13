/**
 * Batch generates MP3 audio for all 94 HVAC lessons.
 *
 * Rules (exact spec):
 *   - MARCUS_INSTRUCTION in `instructions` param ONLY — never read aloud
 *   - Lesson Script_Text in `input` ONLY — what the voice says
 *   - Output: public/hvac/audio/lesson-{uuid}.mp3
 *   - Skips lessons that already have audio
 *   - Processes 3 at a time to stay within rate limits
 *
 * Run: node scripts/batch-generate-audio.mjs
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
dotenv.config({ path: path.join(root, '.env.local'), override: false });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const OUT_DIR = path.join(root, 'public', 'hvac', 'audio');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Voice style — instructions param ONLY, never in input
const MARCUS_INSTRUCTION =
  'Speak as Marcus Johnson — a licensed master electrician and HVAC technician ' +
  'with 20 years of field experience. Your tone is direct, confident, and practical. ' +
  'You speak like a tradesman who has seen everything in the field, not like a textbook. ' +
  'Pace yourself clearly — students are taking notes. Emphasize key numbers and safety warnings. ' +
  'Pause naturally between concepts.';

// Load lesson scripts
const lessons = JSON.parse(readFileSync(path.join(root, 'data/hvac-lesson-scripts.json'), 'utf8'));

async function generateAudio(lesson) {
  const outPath = path.join(OUT_DIR, `lesson-${lesson.uuid}.mp3`);

  if (existsSync(outPath)) {
    const size = existsSync(outPath) ? readFileSync(outPath).length : 0;
    // Skip if file exists and is > 50KB (real audio, not a stub)
    if (size > 50000) {
      console.log(`  ⏭  ${lesson.defId} — already exists (${(size/1024).toFixed(0)}KB)`);
      return 'skipped';
    }
  }

  return new Promise((resolve) => {
    const tryModel = (model = 'gpt-4o-mini-tts', retries = 2) => {
      const bodyObj = {
        model: 'gpt-4o-mini-tts',
        voice: 'echo',
        input: lesson.script,   // lesson script ONLY
        instructions: MARCUS_INSTRUCTION, // voice style, never read aloud
      };
      const body = JSON.stringify(bodyObj);

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
          // Rate limited — wait and retry
          const wait = 20000;
          console.log(`  ⏳ Rate limited on ${lesson.defId} — waiting ${wait/1000}s...`);
          setTimeout(() => tryModel(model, retries - 1), wait);
          return;
        }
        if (res.statusCode !== 200) {
          let err = '';
          res.on('data', d => err += d);
          res.on('end', () => {
            if (retries > 0) {
              setTimeout(() => tryModel(model, retries - 1), 5000);
            } else {
              console.error(`  ❌ ${lesson.defId} failed: ${res.statusCode}`);
              resolve('failed');
            }
          });
          return;
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          writeFileSync(outPath, buf);
          console.log(`  ✅ ${lesson.defId} — ${(buf.length/1024).toFixed(0)}KB`);
          resolve('generated');
        });
      });
      req.on('error', (e) => {
        if (retries > 0) {
          setTimeout(() => tryModel(model, retries - 1), 5000);
        } else {
          console.error(`  ❌ ${lesson.defId} network error: ${e.message}`);
          resolve('failed');
        }
      });
      req.write(body);
      req.end();
    };

    tryModel();
  });
}

// Process in batches of 3 to respect rate limits
const CONCURRENCY = 3;
let generated = 0, skipped = 0, failed = 0;

console.log(`\nGenerating audio for ${lessons.length} HVAC lessons...`);
console.log(`Output: ${OUT_DIR}\n`);

for (let i = 0; i < lessons.length; i += CONCURRENCY) {
  const batch = lessons.slice(i, i + CONCURRENCY);
  const results = await Promise.all(batch.map(generateAudio));
  for (const r of results) {
    if (r === 'generated') generated++;
    else if (r === 'skipped') skipped++;
    else failed++;
  }
  // Small delay between batches
  if (i + CONCURRENCY < lessons.length) {
    await new Promise(r => setTimeout(r, 1000));
  }
}

console.log(`\n✅ Done: ${generated} generated, ${skipped} skipped, ${failed} failed`);
console.log(`   Files in: ${OUT_DIR}`);
