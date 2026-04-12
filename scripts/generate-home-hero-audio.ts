#!/usr/bin/env npx tsx
/**
 * Generates /public/audio/heroes/home.mp3
 *
 * Transcript matches content/heroBanners.ts home.transcript exactly.
 * Voice: onyx — consistent with all other hero audio.
 * Model: tts-1-hd, speed: 0.95
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... pnpm tsx scripts/generate-home-hero-audio.ts
 *
 * Skips generation if the file already exists. Pass --force to overwrite.
 */

import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OUT_PATH = resolve('public/audio/heroes/home.mp3');
const FORCE = process.argv.includes('--force');

const TRANSCRIPT =
  'At Elevate for Humanity, career training is built for real life. Short-term programs. Industry credentials. Funding that can cover the cost. And a direct path to work.';

async function main() {
  if (!OPENAI_KEY) {
    console.error('OPENAI_API_KEY is not set. Set it and re-run.');
    process.exit(1);
  }

  if (existsSync(OUT_PATH) && !FORCE) {
    console.log(`Already exists: ${OUT_PATH}  (pass --force to regenerate)`);
    process.exit(0);
  }

  console.log('Generating home hero audio...');

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
  console.log(`Written: ${OUT_PATH} (${buf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
