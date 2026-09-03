/**
 * Download barber b-roll clips from Pexels (free license).
 * Targets 640x360 MP4 — small enough to commit, large enough for lesson compositing.
 * Skip-if-exists: safe to re-run.
 *
 * Usage: node scripts/download-barber-broll.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load env
for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.+)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const PEXELS_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_KEY) {
  console.error('PEXELS_API_KEY not set');
  process.exit(1);
}

const OUT_DIR = path.join(ROOT, 'public/videos/broll');
fs.mkdirSync(OUT_DIR, { recursive: true });

// 36 clips the generator expects → best Pexels search query
const CLIPS = [
  { name: 'barber-cutting-hair', query: 'barber cutting hair' },
  { name: 'barber-lineup', query: 'barber lineup haircut' },
  { name: 'barber-fade', query: 'barber fade haircut clipper' },
  { name: 'barber-shaving', query: 'barber straight razor shaving' },
  { name: 'barber-beard-trim', query: 'barber beard trim' },
  { name: 'barber-shampoo', query: 'barber shampoo hair wash' },
  { name: 'barber-styling', query: 'barber hair styling' },
  { name: 'client-consultation', query: 'barber client consultation mirror' },
  { name: 'disinfecting-clippers', query: 'cleaning barber clippers disinfect' },
  { name: 'disinfecting-scissors', query: 'cleaning scissors salon' },
  { name: 'washing-hands-barber', query: 'washing hands hygiene' },
  { name: 'cleaning-barber-station', query: 'cleaning barber station salon' },
  { name: 'neck-strip-cape', query: 'barber cape neck strip client' },
  { name: 'disposing-single-use', query: 'disposing gloves single use' },
  { name: 'blood-exposure-protocol', query: 'first aid gloves safety' },
  { name: 'osha-barbershop', query: 'workplace safety signage' },
  { name: 'ppe-barber', query: 'gloves mask protective equipment' },
  { name: 'chemical-handling', query: 'chemical bottles salon safety' },
  { name: 'patch-test', query: 'skin patch test allergy' },
  { name: 'sds-safety-data-sheet', query: 'safety data sheet chemical label' },
  { name: 'hair-color-chemical', query: 'hair color dye salon application' },
  { name: 'relaxer-texturizer', query: 'hair relaxer chemical treatment' },
  { name: 'ph-scale-hair', query: 'hair science scalp treatment' },
  { name: 'ergonomics-posture', query: 'ergonomics posture standing work' },
  { name: 'first-impression-barber', query: 'barber greeting client professional' },
  { name: 'professional-appearance', query: 'professional grooming appearance' },
  { name: 'ethics-professional', query: 'professional handshake business ethics' },
  { name: 'client-retention', query: 'customer service salon loyalty' },
  { name: 'handling-complaints', query: 'customer complaint resolution service' },
  { name: 'time-management-barber', query: 'time management schedule planning' },
  { name: 'smart-goals-planning', query: 'goal setting planning notebook' },
  { name: 'burnout-wellness', query: 'wellness self care stress relief' },
  { name: 'logging-hours-timesheet', query: 'timesheet hours logging work' },
  { name: 'apprentice-training', query: 'apprentice training mentor workplace' },
  { name: 'barber-license-exam', query: 'exam test certification professional' },
  { name: 'indiana-license-renewal', query: 'license certificate professional renewal' },
  { name: 'state-board-exam-prep', query: 'study exam preparation test' },
];

async function pexelsSearch(query) {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${query}`);
  return res.json();
}

function pick360(video) {
  // Prefer 640x360, fall back to smallest available
  const files = video.video_files.filter((f) => f.file_type === 'video/mp4');
  const p360 = files.find((f) => f.height === 360);
  if (p360) return p360.link;
  files.sort((a, b) => a.width - b.width);
  return files[0]?.link;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buf));
}

async function run() {
  let done = 0,
    skipped = 0,
    failed = 0;

  for (const clip of CLIPS) {
    const dest = path.join(OUT_DIR, `${clip.name}.mp4`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
      console.log(`⏭  skip   ${clip.name}`);
      skipped++;
      continue;
    }

    try {
      const data = await pexelsSearch(clip.query);
      const video = data.videos?.[0];
      if (!video) throw new Error('No results');

      const link = pick360(video);
      if (!link) throw new Error('No 360p file');

      process.stdout.write(`⬇  ${clip.name} ... `);
      await download(link, dest);
      const mb = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
      console.log(`${mb} MB`);
      done++;

      // Rate limit: 200 req/min on free tier — 300ms gap is safe
      await new Promise((r) => setTimeout(r, 350));
    } catch (err) {
      console.error(`❌ ${clip.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${done} downloaded, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
