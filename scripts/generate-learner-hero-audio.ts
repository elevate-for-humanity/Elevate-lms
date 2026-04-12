#!/usr/bin/env npx tsx
/**
 * Generates /public/audio/heroes/learner.mp3
 *
 * Uses the transcript from content/heroBanners.ts (learner entry).
 * Voice: onyx (same as all other hero audio).
 * Model: tts-1-hd
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... pnpm tsx scripts/generate-learner-hero-audio.ts
 *
 * Skips generation if the file already exists. Pass --force to overwrite.
 */

import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OUT_PATH = resolve('public/audio/heroes/learner.mp3');
const FORCE = process.argv.includes('--force');

// Transcript must match content/heroBanners.ts learner.transcript exactly.
const TRANSCRIPT =
  'Welcome to Elevate. Your program is structured, your progress is tracked, and your credential is waiting at the finish line. Complete each lesson, pass your checkpoints, and your certification is issued automatically. If you need help at any point, your advisor is one message away.';

async function main() {
  if (!OPENAI_KEY) {
    console.error('OPENAI_API_KEY is not set. Set it and re-run.');
    process.exit(1);
  }

  if (existsSync(OUT_PATH) && !FORCE) {
    console.log(`Already exists: ${OUT_PATH}  (pass --force to regenerate)`);
    process.exit(0);
  }

  console.log('Generating learner hero audio...');

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      voice: 'onyx',
      input: TRANSCRIPT,
      speed: 0.95,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`TTS error: ${err}`);
    process.exit(1);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(OUT_PATH, buf);
  console.log(`✅ Written: ${OUT_PATH} (${buf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
