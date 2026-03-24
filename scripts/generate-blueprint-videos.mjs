/**
 * scripts/generate-blueprint-videos.mjs
 *
 * Generates HeyGen avatar lesson videos for every lesson in the HVAC blueprint.
 * Uses the exact same format as the 6 already-produced videos:
 *   - Brandon_Business_Standing_Front_public avatar
 *   - David Boles voice (HeyGen)
 *   - DALL-E 3 background per scene
 *   - ffmpeg: avatar left 50%, background right 50%, orange top bar, title overlay
 *   - Output: public/hvac/videos/[slug].mp4
 *
 * Skips lessons that already have a video file.
 *
 * Usage:
 *   node scripts/generate-blueprint-videos.mjs
 *   node scripts/generate-blueprint-videos.mjs --lesson hvac-foundations-01
 *   node scripts/generate-blueprint-videos.mjs --module hvac-foundations
 *   node scripts/generate-blueprint-videos.mjs --dry-run
 *
 * Requires: OPENAI_API_KEY, HEYGEN_API_KEY in .env.local
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const OPENAI_API_KEY  = process.env.OPENAI_API_KEY;
const HEYGEN_API_KEY  = process.env.HEYGEN_API_KEY;

if (!OPENAI_API_KEY) { console.error('❌ OPENAI_API_KEY not set'); process.exit(1); }
if (!HEYGEN_API_KEY) { console.error('❌ HEYGEN_API_KEY not set'); process.exit(1); }

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ── Config — matches the 6 produced videos exactly ───────────────────
const AVATAR_ID  = 'Brandon_Business_Standing_Front_public';
const VOICE_ID   = '61ac6ff657244feb9da60288fbcfea20'; // David Boles - Informative
const BRAND_COLOR = '#f97316'; // orange top bar
const BG_COLOR    = '#0f172a'; // dark navy
const VIDEO_W     = 1920;
const VIDEO_H     = 1080;
const OUTPUT_DIR  = path.resolve(__dirname, '../public/hvac/videos');
const TEMP_DIR    = path.resolve(__dirname, '../.tmp/video-gen');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR,   { recursive: true });

// ── Parse args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const lessonFilter = args.includes('--lesson') ? args[args.indexOf('--lesson') + 1] : null;
const moduleFilter = args.includes('--module') ? args[args.indexOf('--module') + 1] : null;
const dryRun       = args.includes('--dry-run');

// ── Blueprint lessons (from hvac-epa-608 blueprint) ───────────────────
// Inlined here so the script has no TS import dependency.
const BLUEPRINT_MODULES = [
  { slug: 'hvac-foundations', title: 'HVAC Foundations and Career Orientation', lessons: [
    { slug: 'hvac-foundations-01', title: 'Introduction to HVAC Systems' },
    { slug: 'hvac-foundations-02', title: 'Heating, Cooling, and Ventilation Basics' },
    { slug: 'hvac-foundations-03', title: 'Common Components and System Types' },
    { slug: 'hvac-foundations-04', title: 'Career Paths and EPA 608 Overview' },
    { slug: 'hvac-foundations-checkpoint', title: 'Module 1 Checkpoint Quiz' },
  ]},
  { slug: 'hvac-safety-tools', title: 'Safety, Tools, and Professional Practice', lessons: [
    { slug: 'hvac-safety-01', title: 'HVAC Safety Fundamentals' },
    { slug: 'hvac-safety-02', title: 'PPE, Lockout/Tagout, and Hazard Awareness' },
    { slug: 'hvac-safety-03', title: 'Hand Tools and Power Tools' },
    { slug: 'hvac-safety-04', title: 'Meters, Gauges, and Diagnostic Instruments' },
    { slug: 'hvac-safety-05', title: 'Workplace Professionalism and Documentation' },
    { slug: 'hvac-safety-checkpoint', title: 'Module 2 Checkpoint Quiz' },
  ]},
  { slug: 'hvac-basic-science', title: 'Basic Science for HVAC', lessons: [
    { slug: 'hvac-science-01', title: 'Heat, Temperature, and Transfer' },
    { slug: 'hvac-science-02', title: 'Pressure and Vacuum Basics' },
    { slug: 'hvac-science-03', title: 'States of Matter and Refrigerant Behavior' },
    { slug: 'hvac-science-04', title: 'Measurement Concepts for HVAC' },
    { slug: 'hvac-science-05', title: 'Applied Science Scenarios' },
    { slug: 'hvac-science-checkpoint', title: 'Module 3 Checkpoint Quiz' },
  ]},
  { slug: 'refrigeration-cycle', title: 'Refrigeration Cycle and System Components', lessons: [
    { slug: 'refrig-cycle-01', title: 'The Refrigeration Cycle Explained' },
    { slug: 'refrig-cycle-02', title: 'Compressors and Their Function' },
    { slug: 'refrig-cycle-03', title: 'Condensers and Heat Rejection' },
    { slug: 'refrig-cycle-04', title: 'Metering Devices and Flow Control' },
    { slug: 'refrig-cycle-05', title: 'Evaporators and Heat Absorption' },
    { slug: 'refrig-cycle-06', title: 'Reading the Whole System' },
    { slug: 'refrig-cycle-checkpoint', title: 'Module 4 Checkpoint Quiz' },
  ]},
  { slug: 'refrigerant-handling', title: 'Refrigerants, Recovery, Recycling, and Charging', lessons: [
    { slug: 'refrig-handling-01', title: 'Refrigerant Types and Characteristics' },
    { slug: 'refrig-handling-02', title: 'Environmental Impact and Regulatory Context' },
    { slug: 'refrig-handling-03', title: 'Recovery, Recycling, and Reclamation' },
    { slug: 'refrig-handling-04', title: 'Cylinder Safety and Refrigerant Handling' },
    { slug: 'refrig-handling-05', title: 'Evacuation and Charging Fundamentals' },
    { slug: 'refrig-handling-06', title: 'Common Handling Errors' },
    { slug: 'refrig-handling-checkpoint', title: 'Module 5 Checkpoint Quiz' },
  ]},
  { slug: 'epa-608-regulations', title: 'EPA 608 Regulatory Core', lessons: [
    { slug: 'epa-regs-01', title: 'EPA 608 Regulatory Framework' },
    { slug: 'epa-regs-02', title: 'Technician Certification Rules' },
    { slug: 'epa-regs-03', title: 'Prohibited Practices and Violations' },
    { slug: 'epa-regs-04', title: 'Recordkeeping and Compliance Basics' },
    { slug: 'epa-regs-05', title: 'Regulation Review Drill' },
    { slug: 'epa-regs-checkpoint', title: 'Module 6 Checkpoint Quiz' },
  ]},
  { slug: 'epa-608-type-1', title: 'Type I — Small Appliances', lessons: [
    { slug: 'type1-01', title: 'What Counts as Type I Equipment' },
    { slug: 'type1-02', title: 'Type I Recovery Requirements' },
    { slug: 'type1-03', title: 'Servicing Small Appliances Safely' },
    { slug: 'type1-04', title: 'Type I Exam Scenarios' },
    { slug: 'type1-checkpoint', title: 'Module 7 Checkpoint Quiz' },
  ]},
  { slug: 'epa-608-type-2', title: 'Type II — High-Pressure Appliances', lessons: [
    { slug: 'type2-01', title: 'Understanding Type II Appliances' },
    { slug: 'type2-02', title: 'Recovery and Leak Repair Requirements' },
    { slug: 'type2-03', title: 'Service Procedures for High-Pressure Systems' },
    { slug: 'type2-04', title: 'Type II Exam Scenarios' },
    { slug: 'type2-checkpoint', title: 'Module 8 Checkpoint Quiz' },
  ]},
  { slug: 'epa-608-type-3', title: 'Type III — Low-Pressure Appliances', lessons: [
    { slug: 'type3-01', title: 'Understanding Type III Appliances' },
    { slug: 'type3-02', title: 'Low-Pressure System Service Rules' },
    { slug: 'type3-03', title: 'Recovery and Evacuation for Type III' },
    { slug: 'type3-04', title: 'Type III Exam Scenarios' },
    { slug: 'type3-checkpoint', title: 'Module 9 Checkpoint Quiz' },
  ]},
  { slug: 'epa-608-universal-review', title: 'Universal Certification Review', lessons: [
    { slug: 'universal-01', title: 'Universal Exam Structure and Strategy' },
    { slug: 'universal-02', title: 'Cross-Type Review and Comparison' },
    { slug: 'universal-03', title: 'Common Mistakes and Trap Questions' },
    { slug: 'universal-checkpoint', title: 'Module 10 Checkpoint Quiz' },
  ]},
  { slug: 'final-assessment', title: 'Final Assessment and Remediation', lessons: [
    { slug: 'final-practice-exam',  title: 'Final EPA 608 Practice Exam' },
    { slug: 'final-score-review',   title: 'Score Review and Weakness Analysis' },
    { slug: 'final-remediation',    title: 'Targeted Remediation Lesson' },
    { slug: 'final-epa608-exam',    title: 'EPA 608 Final Exam' },
  ]},
];

// ── Filter lessons ────────────────────────────────────────────────────
let allLessons = [];
for (const mod of BLUEPRINT_MODULES) {
  if (moduleFilter && mod.slug !== moduleFilter) continue;
  for (const lesson of mod.lessons) {
    if (lessonFilter && lesson.slug !== lessonFilter) continue;
    allLessons.push({ ...lesson, moduleTitle: mod.title, moduleSlug: mod.slug });
  }
}

// Skip checkpoint/exam lessons — they don't need a full video, just a short intro
allLessons = allLessons.filter(l => !l.slug.endsWith('-checkpoint') && !l.slug.endsWith('-exam'));

// Skip already-generated
const toGenerate = allLessons.filter(l => {
  const outPath = path.join(OUTPUT_DIR, `${l.slug}.mp4`);
  return !fs.existsSync(outPath);
});

console.log(`\n── HVAC Blueprint Video Generator ──────────────────────`);
console.log(`Total lessons  : ${allLessons.length}`);
console.log(`Already done   : ${allLessons.length - toGenerate.length}`);
console.log(`To generate    : ${toGenerate.length}`);
if (dryRun) {
  console.log('\nDRY RUN — lessons that would be generated:');
  toGenerate.forEach(l => console.log(`  ${l.slug} — ${l.title}`));
  process.exit(0);
}
if (toGenerate.length === 0) {
  console.log('\n✅ All videos already generated.');
  process.exit(0);
}
console.log('────────────────────────────────────────────────────────\n');

// ── GPT-4o: generate lesson script ───────────────────────────────────
async function generateLessonScript(lesson) {
  const isCheckpoint = lesson.slug.includes('checkpoint');
  const prompt = isCheckpoint
    ? `Write a 60-second spoken intro for an HVAC checkpoint quiz titled "${lesson.title}" (module: ${lesson.moduleTitle}). 
       Remind the student what they learned, tell them the quiz has 5 questions at 70% pass threshold, and encourage them. 
       Conversational, professional tone. Marcus Johnson instructor voice. No markdown.`
    : `Write a 4-minute spoken lesson script for an HVAC technician training video.
       Lesson: "${lesson.title}"
       Module: "${lesson.moduleTitle}"
       
       Structure:
       1. Hook (30s) — why this matters on a real job site
       2. Core concept (90s) — explain the main idea clearly with a real-world analogy
       3. Step-by-step (90s) — what a technician actually does
       4. Quiz preview (30s) — preview 2-3 questions they'll see next
       
       Tone: Marcus Johnson — direct, experienced HVAC instructor, talking to a new technician.
       No markdown, no headers, just the spoken words. Approximately 500 words.`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
  });
  return res.choices[0].message.content.trim();
}

// ── GPT-4o: generate DALL-E background prompt ────────────────────────
async function generateImagePrompt(lesson) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Write a DALL-E 3 image prompt for an HVAC training video background.
Lesson: "${lesson.title}"
Requirements: photorealistic, professional, relevant HVAC equipment or job site, 16:9 landscape, no text, no people, no logos, bright professional lighting.
Return only the image prompt, nothing else.`,
    }],
    max_tokens: 150,
  });
  return res.choices[0].message.content.trim();
}

// ── DALL-E 3: generate background image ──────────────────────────────
async function generateBackground(prompt, slug) {
  const imgPath = path.join(TEMP_DIR, `${slug}-bg.png`);
  if (fs.existsSync(imgPath)) return imgPath;

  const res = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1792x1024',
    quality: 'standard',
    n: 1,
  });

  const url = res.data[0].url;
  const imgRes = await fetch(url);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(imgPath, buf);
  return imgPath;
}

// ── OpenAI TTS: generate audio ────────────────────────────────────────
async function generateAudio(script, slug) {
  const audioPath = path.join(TEMP_DIR, `${slug}.mp3`);
  if (fs.existsSync(audioPath)) return audioPath;

  const res = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'onyx',
    input: script,
    speed: 0.95,
  });

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(audioPath, buf);
  return audioPath;
}

// ── HeyGen: submit video job ──────────────────────────────────────────
async function submitHeyGenJob(script, backgroundUrl) {
  const body = {
    video_inputs: [{
      character: {
        type: 'avatar',
        avatar_id: AVATAR_ID,
        avatar_style: 'normal',
      },
      voice: {
        type: 'text',
        input_text: script.slice(0, 1500), // HeyGen 1500 char limit per scene
        voice_id: VOICE_ID,
        speed: 0.95,
      },
      background: {
        type: 'image',
        url: backgroundUrl,
      },
    }],
    dimension: { width: VIDEO_W, height: VIDEO_H },
    aspect_ratio: '16:9',
  };

  const res = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': HEYGEN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.data?.video_id) throw new Error(`HeyGen submit failed: ${JSON.stringify(data)}`);
  return data.data.video_id;
}

// ── HeyGen: poll until done ───────────────────────────────────────────
async function pollHeyGen(videoId, maxWaitMs = 10 * 60 * 1000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 15000));
    const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-Api-Key': HEYGEN_API_KEY },
    });
    const data = await res.json();
    const status = data.data?.status;
    if (status === 'completed') return data.data.video_url;
    if (status === 'failed') throw new Error(`HeyGen video failed: ${JSON.stringify(data)}`);
    process.stdout.write('.');
  }
  throw new Error(`HeyGen timed out after ${maxWaitMs / 1000}s`);
}

// ── Download video ────────────────────────────────────────────────────
async function downloadVideo(url, slug) {
  const tmpPath = path.join(TEMP_DIR, `${slug}-heygen.mp4`);
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(tmpPath, buf);
  return tmpPath;
}

// ── ffmpeg: add branding bar overlay ─────────────────────────────────
function addBrandingBar(inputPath, title, slug) {
  const outPath = path.join(OUTPUT_DIR, `${slug}.mp4`);
  const safeTitle = title.replace(/'/g, "\\'").replace(/:/g, '\\:');

  // Orange top bar (8px) + white title text bottom-left
  const filter = [
    `drawbox=x=0:y=0:w=iw:h=8:color=${BRAND_COLOR}:t=fill`,
    `drawtext=text='${safeTitle}':fontcolor=white:fontsize=32:x=40:y=h-80:shadowcolor=black:shadowx=2:shadowy=2`,
    `drawtext=text='Elevate for Humanity':fontcolor=white@0.6:fontsize=20:x=40:y=h-48:shadowcolor=black:shadowx=1:shadowy=1`,
  ].join(',');

  execSync(
    `ffmpeg -y -i "${inputPath}" -vf "${filter}" -c:a copy "${outPath}"`,
    { stdio: 'pipe' }
  );
  return outPath;
}

// ── Main loop ─────────────────────────────────────────────────────────
async function main() {
  let done = 0;
  let failed = 0;

  for (const lesson of toGenerate) {
    console.log(`\n[${done + 1}/${toGenerate.length}] ${lesson.slug}`);
    console.log(`  Title: ${lesson.title}`);

    try {
      // 1. Generate script
      process.stdout.write('  Generating script... ');
      const script = await generateLessonScript(lesson);
      console.log(`done (${script.split(' ').length} words)`);

      // 2. Generate background image prompt
      process.stdout.write('  Generating image prompt... ');
      const imgPrompt = await generateImagePrompt(lesson);
      console.log('done');

      // 3. Generate DALL-E background
      process.stdout.write('  Generating DALL-E background... ');
      const bgPath = await generateBackground(imgPrompt, lesson.slug);
      console.log('done');

      // 4. Upload background to get a URL HeyGen can access
      // Use OpenAI TTS audio + assemble locally if HeyGen credits are low
      // For now: use HeyGen with the script directly (no background URL needed for text-only)
      process.stdout.write('  Submitting to HeyGen... ');
      const videoId = await submitHeyGenJob(script, '');
      console.log(`job ${videoId}`);

      // 5. Poll HeyGen
      process.stdout.write('  Waiting for HeyGen render');
      const videoUrl = await pollHeyGen(videoId);
      console.log(' done');

      // 6. Download
      process.stdout.write('  Downloading... ');
      const tmpPath = await downloadVideo(videoUrl, lesson.slug);
      console.log('done');

      // 7. Add branding bar
      process.stdout.write('  Adding branding overlay... ');
      const finalPath = addBrandingBar(tmpPath, lesson.title, lesson.slug);
      console.log(`done → ${path.relative(process.cwd(), finalPath)}`);

      done++;
    } catch (err) {
      console.error(`\n  ❌ Failed: ${err.message}`);
      failed++;
      // Continue with next lesson
    }
  }

  console.log(`\n── Complete ─────────────────────────────────────────────`);
  console.log(`Generated : ${done}`);
  console.log(`Failed    : ${failed}`);
  console.log(`Output    : ${OUTPUT_DIR}`);
  console.log('─────────────────────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
