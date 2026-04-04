/**
 * generate-lesson-video-runway.ts
 *
 * Generates a single lesson video using:
 *   1. GPT-4o  — writes narration + per-segment visual prompts
 *   2. Runway Gen4.5 — generates one 10s clip per segment (5 segments = 50s raw)
 *   3. ffmpeg  — stitches clips together
 *   4. OpenAI TTS (onyx) — generates full narration audio
 *   5. ffmpeg  — muxes narration over stitched video, loops video if needed
 *
 * Policy: this is the canonical video generator for all new programs.
 * Called by seed-course-from-blueprint when videoConfig.videoGenerator === 'runway'.
 *
 * Usage:
 *   pnpm tsx scripts/generate-lesson-video-runway.ts \
 *     --slug barber-lesson-1 \
 *     --title "Welcome to the Barber Apprenticeship" \
 *     --module "Infection Control & Safety" \
 *     --out public/videos/barber-lessons/barber-lesson-1.mp4
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import OpenAI from 'openai';
import {
  generateRunwayClip,
  buildVisualPrompt,
  stitchClips,
  muxAudioOverVideo,
} from '../lib/video/runway';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface LessonVideoInput {
  slug:        string;
  title:       string;
  moduleName:  string;
  content:     string;
  outputPath:  string;
  ttsVoice?:   string;
  ttsSpeed?:   number;
}

const SEGMENTS = ['intro', 'concept', 'visual', 'application', 'wrapup'] as const;

/** Ask GPT-4o for narration + one visual prompt per segment */
async function buildScript(input: LessonVideoInput): Promise<{
  narration: string;
  visualPrompts: Record<string, string>;
}> {
  const plain = input.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.4,
    messages: [{
      role: 'system',
      content: `You are a professional instructional video scriptwriter for a barber apprenticeship program.`,
    }, {
      role: 'user',
      content: `
Lesson: "${input.title}"
Module: "${input.moduleName}"
Content: ${plain}

Write a 5-segment lesson video script. Return ONLY valid JSON:
{
  "narration": "Full spoken narration, 950-1050 words, natural spoken language.",
  "visualPrompts": {
    "intro":       "2-8 word Runway video prompt — establishing barbershop shot",
    "concept":     "2-8 word Runway video prompt — close-up detail relevant to topic",
    "visual":      "2-8 word Runway video prompt — overhead or process view",
    "application": "2-8 word Runway video prompt — hands-on demonstration",
    "wrapup":      "2-8 word Runway video prompt — confident barber, clean shop"
  }
}

Visual prompt rules:
- Real barbershop footage style, cinematic
- Specific to the lesson topic (e.g. "barber disinfecting clippers in blue solution")
- No text, no slides, no graphics — pure video action
`,
    }],
  });

  const raw = res.choices[0].message.content ?? '{}';
  const json = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(json);
}

/** Generate TTS narration MP3 */
async function generateNarration(
  text: string,
  outputPath: string,
  voice = 'onyx',
  speed = 0.88,
): Promise<void> {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: voice as any,
    input: text,
    speed,
  });
  const buf = Buffer.from(await mp3.arrayBuffer());
  fs.writeFileSync(outputPath, buf);
}

function getAudioDuration(p: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${p}"`,
      { encoding: 'utf8' },
    );
    return parseFloat(out.trim()) || 60;
  } catch { return 60; }
}

export async function generateLessonVideoRunway(input: LessonVideoInput): Promise<void> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'runway-lesson-'));
  console.log(`\n📹 ${input.title}`);

  try {
    // 1. Script
    console.log('  ✍️  Writing script...');
    const { narration, visualPrompts } = await buildScript(input);
    console.log(`  ✓ Narration: ${narration.split(' ').length} words`);

    // 2. Generate one Runway clip per segment (in parallel, max 3 at a time)
    console.log('  🎬 Generating Runway clips...');
    const clipPaths: string[] = [];

    for (let i = 0; i < SEGMENTS.length; i++) {
      const seg = SEGMENTS[i];
      const prompt = buildVisualPrompt(input.title, seg, visualPrompts[seg]);
      const clipPath = path.join(tmp, `clip-${i}.mp4`);
      console.log(`  [${i + 1}/5] ${seg}: "${prompt}"`);
      await generateRunwayClip({ promptText: prompt, duration: 10, ratio: '1280:720' }, clipPath);
      clipPaths.push(clipPath);
    }

    // 3. Stitch clips
    console.log('  🔗 Stitching clips...');
    const stitchedPath = path.join(tmp, 'stitched.mp4');
    stitchClips(clipPaths, stitchedPath);

    // 4. TTS narration
    console.log('  🔊 Generating narration...');
    const audioPath = path.join(tmp, 'narration.mp3');
    await generateNarration(narration, audioPath, input.ttsVoice ?? 'onyx', input.ttsSpeed ?? 0.88);
    const audioDur = getAudioDuration(audioPath);
    console.log(`  ✓ Audio: ${audioDur.toFixed(0)}s`);

    // 5. Mux — loop video over narration
    console.log('  🎞️  Muxing...');
    fs.mkdirSync(path.dirname(input.outputPath), { recursive: true });
    muxAudioOverVideo(stitchedPath, audioPath, input.outputPath);

    const finalDur = getAudioDuration(input.outputPath);
    const size = (fs.statSync(input.outputPath).size / 1024 / 1024).toFixed(1);
    console.log(`  ✅ Done: ${finalDur.toFixed(0)}s, ${size}MB → ${input.outputPath}`);

  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ── CLI entry point ───────────────────────────────────────────────────────────
if (process.argv[1].includes('generate-lesson-video-runway')) {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const slug    = get('--slug')   ?? 'barber-lesson-1';
  const title   = get('--title')  ?? 'Welcome to the Barber Apprenticeship';
  const module_ = get('--module') ?? 'Infection Control & Safety';
  const out     = get('--out')    ?? `public/videos/barber-lessons/${slug}.mp4`;

  // Pull content from blueprint
  const { barberApprenticeshipBlueprint } = await import('../lib/curriculum/blueprints/barber-apprenticeship');
  let content = '';
  for (const mod of barberApprenticeshipBlueprint.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.slug === slug) { content = lesson.content ?? ''; break; }
    }
  }

  await generateLessonVideoRunway({
    slug, title, moduleName: module_, content,
    outputPath: path.resolve(process.cwd(), out),
  });
}
