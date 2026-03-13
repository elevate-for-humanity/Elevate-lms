/**
 * Generate Marcus Johnson voiceover audio for all 94 HVAC lessons.
 *
 * Run:  npx tsx scripts/generate-hvac-audio.ts
 *
 * - Skips lessons that already have audio in public/hvac/audio/
 * - Processes 5 lessons concurrently to stay within OpenAI rate limits
 * - Falls back from gpt-4o-mini-tts to tts-1-hd automatically
 * - Exits 0 on success, 1 if OpenAI is not configured
 *
 * Output: public/hvac/audio/lesson-{uuid}.mp3
 *
 * Once generated, files are served as static assets — no API key needed
 * at runtime. HvacLessonVideo checks for the file with a HEAD request
 * and falls back to b-roll video if it is missing.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env files — shell environment takes priority over file values
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false });
dotenv.config({ path: path.join(process.cwd(), '.env'), override: false });

// ── Imports after env is loaded ──────────────────────────────────────────

import { HVAC_LESSON_UUID } from '../lib/courses/hvac-uuids';
import { HVAC_LESSON_CONTENT } from '../lib/courses/hvac-lesson-content';
import { isOpenAIConfigured, getOpenAIClient } from '../lib/openai-client';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'hvac', 'audio');
const CONCURRENCY = 5;

// Marcus personality instruction — same voice across all lessons
const MARCUS_INSTRUCTION =
  'Speak as Marcus Johnson — a licensed master electrician and HVAC technician ' +
  'with 20 years of field experience. Your tone is direct, confident, and practical. ' +
  'You speak like a tradesman who has seen everything in the field, not like a textbook. ' +
  'Pace yourself clearly — students are taking notes. Emphasize key numbers and safety warnings. ' +
  'Pause naturally between concepts.';

// Module-specific opening hooks
const MODULE_HOOKS: Record<number, string> = {
  1:  "Let's talk about what this program is going to do for you.",
  2:  "Before you touch a single tool, you need to understand what HVAC systems actually do.",
  3:  "Electricity runs everything in an HVAC system. If you don't understand it, you can't diagnose anything.",
  4:  "Heating systems keep people alive in winter. You need to know them cold.",
  5:  "The refrigeration cycle is the foundation of everything you'll do in this trade.",
  6:  "EPA 608 is not optional. You cannot legally touch refrigerant without it. Let's make sure you pass.",
  7:  "Type I covers small appliances. Don't underestimate this section — it has tricky questions.",
  8:  "Type II is the bread and butter of residential HVAC. This is what you'll use every day.",
  9:  "Type III covers low-pressure chillers. These are commercial systems — big equipment, big consequences.",
  10: "Ductwork is where most systems lose efficiency. Learn to read it and you'll find problems other techs miss.",
  11: "Controls and thermostats are the brain of the system. When they fail, nothing works right.",
  12: "Heat pumps are the future of residential HVAC. R-410A replacements are all heat pump compatible.",
  13: "Troubleshooting is a skill, not a guess. We're going to build your diagnostic process from the ground up.",
  14: "Commercial HVAC is a different world — bigger systems, more complexity, higher stakes.",
  15: "Your career starts the day you walk out of here. Let's make sure you're ready.",
  16: "This is the capstone. Everything we've covered comes together here.",
};

// Closing questions that prime the student before moving on
const MODULE_CLOSINGS: Record<number, string> = {
  5:  "Before you move on — what happens to refrigerant in the evaporator? Don't look it up. Think about it.",
  6:  "Quick check: what is the maximum fine for knowingly venting refrigerant? If you don't know that number, go back and read it again.",
  7:  "What is the maximum charge that defines a small appliance under EPA 608? That number is on the exam.",
  8:  "What recovery level do you need on a system under 200 pounds using post-1993 equipment? Know that cold.",
  9:  "Why does a low-pressure system have air leaking in rather than refrigerant leaking out? Think about the pressure relationship.",
  13: "You get a call — condenser fan not spinning, compressor humming. What's the first thing you check? Answer that before you move on.",
};

function buildScript(defId: string): string {
  const content = HVAC_LESSON_CONTENT[defId];
  const parts = defId.split('-');
  const moduleNum = parseInt(parts[1], 10);

  const hook = MODULE_HOOKS[moduleNum] ?? `Let's get into this lesson.`;

  if (!content) {
    return `${hook}\n\nReview the lesson materials carefully and take notes on the key concepts. Apply what you learn on every service call.`;
  }

  // Concept — cap at 200 words for audio pacing
  const conceptWords = content.concept.split(' ');
  const concept = conceptWords.length > 200
    ? conceptWords.slice(0, 200).join(' ') + '...'
    : content.concept;

  // Top 3 key terms
  const termsScript = content.keyTerms.slice(0, 3).length > 0
    ? '\n\nHere are the key terms. Write these down.\n\n' +
      content.keyTerms.slice(0, 3).map(t => `${t.term}: ${t.definition}`).join('\n\n')
    : '';

  // Job application
  const jobScript = content.jobApplication
    ? `\n\nHere's why this matters on the job: ${content.jobApplication}`
    : '';

  // First two watch-for warnings
  const warningsScript = content.watchFor.slice(0, 2).length > 0
    ? '\n\nWatch out for these: ' + content.watchFor.slice(0, 2).join('. And — ')
    : '';

  const closing = MODULE_CLOSINGS[moduleNum] ??
    "Take a minute before you move on. What's the one thing from this lesson you need to remember on a service call?";

  return `${hook}\n\n${concept}${termsScript}${jobScript}${warningsScript}\n\n${closing}`;
}

async function generateOne(defId: string, uuid: string): Promise<'skipped' | 'generated' | 'failed'> {
  const outputPath = path.join(OUTPUT_DIR, `lesson-${uuid}.mp3`);

  if (fs.existsSync(outputPath)) {
    return 'skipped';
  }

  const script = buildScript(defId);
  const openai = getOpenAIClient();

  try {
    const res = await (openai.audio.speech as any).create({
      model: 'gpt-4o-mini-tts',
      voice: 'echo',
      input: script,
      instructions: MARCUS_INSTRUCTION,
      response_format: 'mp3',
    });
    const buffer = Buffer.from(await res.arrayBuffer());

    fs.writeFileSync(outputPath, buffer);
    return 'generated';
  } catch (err) {
    console.error(`  ✗ ${defId}: ${(err as Error).message}`);
    return 'failed';
  }
}

async function runBatch(batch: [string, string][]): Promise<{ skipped: number; generated: number; failed: number }> {
  const results = await Promise.all(batch.map(([defId, uuid]) => generateOne(defId, uuid)));
  return {
    skipped:   results.filter(r => r === 'skipped').length,
    generated: results.filter(r => r === 'generated').length,
    failed:    results.filter(r => r === 'failed').length,
  };
}

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  // Allow key to be passed as first argument: tsx generate-hvac-audio.ts sk-...
  const argKey = process.argv[2];
  if (argKey && argKey.startsWith('sk-')) {
    process.env.OPENAI_API_KEY = argKey;
  }

  if (!isOpenAIConfigured()) {
    console.log('OPENAI_API_KEY not set — skipping HVAC audio generation.');
    console.log('Lessons will use b-roll video until audio is generated.');
    console.log('To generate now: npx tsx scripts/generate-hvac-audio.ts sk-your-key-here');
    process.exit(0);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Single-lesson mode: --lesson-id hvac-06-09 --out /path/to/output.mp3
  const singleLessonId = getArg('--lesson-id');
  const singleOutPath  = getArg('--out');

  if (singleLessonId) {
    if (!singleOutPath) {
      console.error('--out is required when --lesson-id is specified');
      process.exit(1);
    }
    const uuid = HVAC_LESSON_UUID[singleLessonId];
    if (!uuid) {
      console.error(`No UUID found for lesson ${singleLessonId} in HVAC_LESSON_UUID`);
      process.exit(1);
    }
    // Override output path to the caller-specified location
    const originalPath = path.join(OUTPUT_DIR, `lesson-${uuid}.mp3`);
    const result = await generateOne(singleLessonId, uuid);
    if (result === 'failed') { process.exit(1); }
    // Copy to --out path if different
    if (path.resolve(singleOutPath) !== path.resolve(originalPath) && fs.existsSync(originalPath)) {
      fs.mkdirSync(path.dirname(singleOutPath), { recursive: true });
      fs.copyFileSync(originalPath, singleOutPath);
    }
    console.log(`Done: ${singleOutPath}`);
    return;
  }

  // Batch mode — all lessons
  const entries = Object.entries(HVAC_LESSON_UUID) as [string, string][];
  console.log(`Generating audio for ${entries.length} HVAC lessons...`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  let totalSkipped = 0;
  let totalGenerated = 0;
  let totalFailed = 0;

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    const batchNums = batch.map(([id]) => id).join(', ');
    process.stdout.write(`  [${i + 1}-${Math.min(i + CONCURRENCY, entries.length)}/${entries.length}] ${batchNums} ... `);

    const { skipped, generated, failed } = await runBatch(batch);
    totalSkipped += skipped;
    totalGenerated += generated;
    totalFailed += failed;

    const parts = [];
    if (generated > 0) parts.push(`${generated} generated`);
    if (skipped > 0)   parts.push(`${skipped} skipped`);
    if (failed > 0)    parts.push(`${failed} failed`);
    console.log(parts.join(', '));

    if (i + CONCURRENCY < entries.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\nDone.`);
  console.log(`  Generated: ${totalGenerated}`);
  console.log(`  Skipped:   ${totalSkipped} (already existed)`);
  console.log(`  Failed:    ${totalFailed}`);

  if (totalFailed > 0) {
    console.log('\nRe-run the script to retry failed lessons.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
