import fs from 'fs';

// Load UUID map
const uuidContent = fs.readFileSync('lib/courses/hvac-uuids.ts', 'utf8');
const uuidMap = {};
for (const m of uuidContent.matchAll(/'(hvac-\d{2}-\d{2})':\s*'([0-9a-f-]{36})'/g)) {
  uuidMap[m[1]] = m[2];
}

// Load lesson number map
const numContent = fs.readFileSync('lib/courses/hvac-lesson-number-map.ts', 'utf8');
const lessonNums = {};
for (const m of numContent.matchAll(/(\d+):\s*'(hvac-\d{2}-\d{2})'/g)) {
  lessonNums[parseInt(m[1])] = m[2];
}

// Load lesson titles from DB (already fetched) or use module data
const moduleContent = fs.readFileSync('lib/courses/hvac-module-data.ts', 'utf8');

// Brandon clips sorted by duration (longest first = most variety)
// We have 17 clips ranging 15s-302s. Rotate through them for each lesson.
const BRANDON_CLIPS = [
  'temp/heygen-raw/db49a04b8e6043f8812b22c58fbff88c.mp4', // 302s
  'temp/heygen-raw/a37cb28613da4a68adc47bf14741f54d.mp4', // 204s
  'temp/heygen-raw/7f962c50597d4c55b93a322b2ded3e62.mp4', // 195s
  'temp/heygen-raw/51e67dd5474b4c59b555d5366c8942ca.mp4', // 194s
  'temp/heygen-raw/6012a1f58741454cb54373afecbcf564.mp4', // 188s
  'temp/heygen-raw/3cb2e6fd747b4f58b67fb8f71e37d256.mp4', // 176s
  'temp/heygen-raw/89cd997eb559492cb08f0147cad2ad18.mp4', // 112s
  'temp/heygen-raw/3904c795146441e3878273ef9fb06707.mp4', // 81s
  'temp/heygen-raw/60857bd9908b4738a3b6ab5f6b58410c.mp4', // 141s
  'temp/heygen-raw/6c428894d98c42118c9d94fe408ce364.mp4', // 85s
  'temp/heygen-raw/93a55849ac2f410a9fc912b18e7275e6.mp4', // 80s
  'temp/heygen-raw/0c54c896f95a40c7872ff493334b6ea2.mp4', // 34s
  'temp/heygen-raw/0e0f269957d7485db5218db21cb3b807.mp4', // 39s
  'temp/heygen-raw/d673a949fb6941bcb934f333bc8ccd5f.mp4', // 38s
  'temp/heygen-raw/33b6a77c7f5b468cb6f5a326de32dd96.mp4', // 36s
  'temp/heygen-raw/d76e33ee51874765bab9bf4c3a9830c9.mp4', // 34s
  'temp/heygen-raw/d6443e217b3a4c43b75ca9e19e9ed639.mp4', // 37s
];

// Diagram images - use HVAC diagrams from components or generate solid color backgrounds
const DIAGRAM_BACKGROUNDS = [
  'public/images/programs-hq/hvac-technician.jpg',
  'public/images/programs-hq/skilled-trades-hero.jpg',
  'public/images/heroes-hq/how-it-works-hero.jpg',
  'public/images/heroes-hq/programs-hero.jpg',
  'public/images/programs-hq/training-classroom.jpg',
  'public/images/programs-hq/electrical.jpg',
  'public/images/programs-hq/welding.jpg',
  'public/images/trades/program-hvac-technician.jpg',
  'public/images/trades/program-hvac-overview.jpg',
  'public/images/trades/program-electrical-training.jpg',
];

const manifest = [];

for (let i = 1; i <= 95; i++) {
  const defId = lessonNums[i];
  const uuid = defId ? uuidMap[defId] : null;
  const mp3Path = uuid ? `public/generated/lessons/lesson-${uuid}.mp3` : null;
  const hasAudio = mp3Path && fs.existsSync(mp3Path);

  // Rotate Brandon clips across lessons
  const brandonClip = BRANDON_CLIPS[i % BRANDON_CLIPS.length];

  // Rotate diagram backgrounds
  const diagBg = DIAGRAM_BACKGROUNDS[i % DIAGRAM_BACKGROUNDS.length];
  const hasDiag = fs.existsSync(diagBg);

  manifest.push({
    lessonNumber: i,
    defId: defId || null,
    uuid: uuid || null,
    mp3Path: hasAudio ? mp3Path : null,
    brandonClip,
    diagramBackground: hasDiag ? diagBg : null,
    outputPath: `temp/assembled/hvac-lesson-${String(i).padStart(3,'0')}.mp4`,
    status: hasAudio ? 'ready' : 'missing-audio',
  });
}

fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('data/hvac-lesson-manifest.json', JSON.stringify(manifest, null, 2));

const ready = manifest.filter(l => l.status === 'ready').length;
const missingAudio = manifest.filter(l => l.status === 'missing-audio').length;
console.log(`Manifest built: ${manifest.length} lessons`);
console.log(`  Ready to assemble: ${ready}`);
console.log(`  Missing audio:     ${missingAudio}`);
console.log(`\nSaved to data/hvac-lesson-manifest.json`);
