#!/usr/bin/env tsx
/**
 * HVAC Video Generator v6
 *
 * - Animated HTML slides captured as video frames via Puppeteer screencast
 * - Photorealistic backgrounds: equipment close-ups, over-shoulder shots, job sites
 *   (avoids direct face shots to prevent AI-look)
 * - CSS animations: bullets slide in, headings fade, elements pop
 * - Ken Burns motion on every segment
 * - Fast energetic TTS
 */

import { createClient } from '@supabase/supabase-js';
import { COURSE_DEFINITIONS } from '../lib/courses/definitions';
import { HVAC_LESSON_UUID } from '../lib/courses/hvac-uuids';
import { buildLessonContent, isPlaceholderContent } from '../lib/courses/hvac-content-builder';
import {
  titleSlideHTML, sectionSlideHTML, bulletsSlideHTML,
  diagramSlideHTML, splitSlideHTML, summarySlideHTML, demoSlideHTML,
  objectiveSlideHTML, quizSlideHTML, flowchartSlideHTML,
} from './video-lib/slide-html';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import puppeteer, { Browser } from 'puppeteer';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const HVAC_DEF = COURSE_DEFINITIONS.find(c => c.slug === 'hvac-technician')!;

const OUT_DIR = '/tmp/hvac-videos-v6';
const W = 1920;
const H = 1080;
const FPS = 30;
// ─── Bullet timing ──────────────────────────────────────────────

/**
 * Calculate when each bullet should appear based on narration duration.
 * Distributes bullets evenly across the narration with a lead-in delay
 * for the heading to appear first.
 */
function calcBulletDelays(bulletCount: number, audioDuration: number): number[] {
  if (bulletCount === 0) return [];
  const headingTime = 2.0; // heading + bar animate in first 2 seconds
  const endPad = 2.0; // hold after last bullet for wrap-up
  const available = Math.max(4, audioDuration - headingTime - endPad);
  // Each bullet needs at least 4 seconds of screen time for explanation
  const minInterval = 4.0;
  const interval = Math.max(minInterval, available / bulletCount);
  return Array.from({ length: bulletCount }, (_, i) => headingTime + i * interval);
}

// ─── OpenAI ─────────────────────────────────────────────────────

async function callGPT(sys: string, user: string, jsonMode = false): Promise<string> {
  const body: any = {
    model: 'gpt-4o', messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    temperature: 0.4, max_tokens: 5000,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`GPT: ${JSON.stringify(d)}`);
  return d.choices[0].message.content;
}

// Photorealistic backgrounds — gpt-image-1 (real people, real equipment)
async function genPhoto(prompt: string, out: string): Promise<void> {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1536x1024', quality: 'medium' }),
      });
      const d = await r.json();
      if (!r.ok) { if (i < 3) { await new Promise(r => setTimeout(r, 5000 * i)); continue; } throw new Error(JSON.stringify(d)); }
      const b64 = d.data[0].b64_json;
      if (b64) {
        fs.writeFileSync(out, Buffer.from(b64, 'base64'));
      } else {
        const img = await fetch(d.data[0].url);
        fs.writeFileSync(out, Buffer.from(await img.arrayBuffer()));
      }
      return;
    } catch (e: any) { if (i >= 3) throw e; await new Promise(r => setTimeout(r, 5000 * i)); }
  }
}

// Technical diagrams — DALL-E 3 (illustrated style works well for diagrams)
async function genDiagram(prompt: string, out: string): Promise<void> {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1792x1024', quality: 'standard', response_format: 'url' }),
      });
      const d = await r.json();
      if (!r.ok) { if (i < 3) { await new Promise(r => setTimeout(r, 4000 * i)); continue; } throw new Error(JSON.stringify(d)); }
      const img = await fetch(d.data[0].url);
      fs.writeFileSync(out, Buffer.from(await img.arrayBuffer()));
      return;
    } catch (e: any) { if (i >= 3) throw e; await new Promise(r => setTimeout(r, 4000 * i)); }
  }
}

async function genTTS(text: string, out: string): Promise<void> {
  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts', input: text, voice: 'onyx',
      instructions: 'You are a sharp, confident HVAC instructor recording a training video. Keep it moving — no dragging, no filler. Punch key terms. Short pauses between ideas, not long ones. Sound like you know this cold and you are keeping students engaged. Think: experienced trade school instructor who keeps the energy up. Do NOT slow down or get dramatic.',
      response_format: 'mp3', speed: 1.2,
    }),
  });
  if (!r.ok) throw new Error(`TTS: ${await r.text()}`);
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
}

function audioDur(f: string): number {
  return parseFloat(execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${f}"`, { encoding: 'utf8' }).trim());
}

// ─── Slide types ────────────────────────────────────────────────

interface Slide {
  type: 'title' | 'bullets' | 'diagram' | 'split' | 'demo' | 'summary' | 'section';
  narration: string;
  bgPrompt?: string;
  title?: string; subtitle?: string;
  heading?: string; bullets?: string[];
  diagramPrompt?: string; diagramCaption?: string;
  leftHeading?: string; leftBullets?: string[]; rightDiagramPrompt?: string;
  // demo slide: annotated photo with numbered callouts
  demoPhotoPrompt?: string; demoCallouts?: string[];
  takeaways?: string[];
  sectionTitle?: string; sectionNumber?: string;
}

async function genScript(lesson: { title: string; module: string; content: string }): Promise<{ slides: Slide[] }> {
  const sys = `You create INSTITUTIONAL HVAC training videos for an accredited trade school and DOL-approved workforce program.

═══ CORE MODEL: LEARNING CYCLES ═══

Every lesson is built from LEARNING CYCLES. Each concept in the lesson follows this cycle:

1. CONCEPT EXPLANATION (type: "concept") — 45-60 sec
   Teach the concept with: topic, explanation, real-world example, "what happens if it fails", key takeaway.

2. SYSTEM BREAKDOWN (type: "flowchart") — 30-45 sec
   Break the concept into its components with labeled nodes and arrows.
   Each node has a label, description, and optional sub-bullets.

3. DIAGNOSTIC CHECK (embedded in video checkpoint data, not a slide)
   A troubleshooting question: "The system shows [symptom]. What is the likely cause?"

A lesson has 3-4 learning cycles, producing 6-8 content slides plus title/objective/summary/quiz = 10-12 slides total.
Target: 6-8 minutes.

═══ SLIDE TYPES ═══

"title" — Opening hook
  Fields: title, subtitle, bgPrompt, narration (20-30 words)

"objective" — Learning objectives (REQUIRED as slide 2)
  Fields: lessonTitle, objectives (array of 3-4 strings), narration (50-70 words)

"concept" — MAIN TEACHING SLIDE (one per concept in the cycle)
  Fields:
    topic: string — concept name (e.g. "The Compressor")
    explanation: string — 2-3 sentences teaching the concept
    example: string — real-world HVAC example
    application: string — "What happens if this fails?" or diagnostic scenario
    takeaway: string — one-sentence key takeaway
    bgPrompt: string — equipment photo prompt (no people)
    narration: string — 80-120 words covering ALL five parts:
      1. State the topic
      2. Explain it (what it does, how it works)
      3. Real-world example ("In a residential AC unit, you'll find...")
      4. Application ("What happens if this fails? / On a service call, you'd check...")
      5. Key takeaway ("Remember: the compressor...")

  EXAMPLE NARRATION:
  "Let's talk about the compressor. The compressor is the heart of the HVAC system — its job is to compress low-pressure refrigerant vapor and push it through the entire refrigeration cycle. When it compresses the refrigerant, both pressure and temperature increase significantly. In a residential split system, you'll find the compressor inside the outdoor condensing unit, powered by an electric motor — it's that loud humming sound you hear when the AC kicks on. Now, what happens if the compressor fails? The system can't move refrigerant at all, which means zero cooling. On a service call, you'd check for a locked rotor, bad capacitor, or electrical failure. Remember: the compressor moves refrigerant and raises its pressure and temperature."

"flowchart" — SYSTEM BREAKDOWN (follows each concept slide)
  Fields:
    heading: string — what system/component is being broken down
    nodes: array of { label: string, description: string, bullets?: string[] }
    narration: string — 60-90 words walking through each component
  
  3-5 nodes per flowchart. Each node appears one at a time with arrows.
  
  EXAMPLE for refrigeration cycle:
  heading: "Refrigeration Cycle Components"
  nodes: [
    { "label": "Compressor", "description": "Pressurizes refrigerant gas", "bullets": ["Located in outdoor unit", "Raises pressure and temperature"] },
    { "label": "Condenser Coil", "description": "Releases heat outdoors", "bullets": ["Fan blows air across coils", "Gas becomes high-pressure liquid"] },
    { "label": "Expansion Valve", "description": "Drops pressure before evaporator", "bullets": ["Controls refrigerant flow", "Creates pressure drop"] },
    { "label": "Evaporator Coil", "description": "Absorbs indoor heat", "bullets": ["Cold refrigerant absorbs heat", "Air blown across coils cools the space"] }
  ]

"summary" — Recap key takeaways
  Fields: takeaways (array of strings — one per concept), bgPrompt, narration (40-60 words)

"quiz" — Knowledge check teaser (REQUIRED as last slide, do NOT reveal answers)
  Fields: questions (array of {question, options, answer}), narration (30-40 words)
  Include at least one DIAGNOSTIC question: "The system shows [symptom]. What is the likely cause?"

═══ LESSON STRUCTURE ═══

1. title slide
2. objective slide
3-4. Learning Cycle 1: concept slide + flowchart slide
5-6. Learning Cycle 2: concept slide + flowchart slide
7-8. Learning Cycle 3: concept slide + flowchart slide
9. summary slide
10. quiz slide

═══ CHECKPOINT DATA ═══

In addition to slides, output a "checkpoints" array with in-video interaction points.
Each checkpoint fires at a specific timestamp (estimate based on slide position).
Types: "quiz", "scenario", "hotspot"

For EACH learning cycle, include one checkpoint AFTER the flowchart slide:
- Type "scenario" for diagnostic thinking: "The system is running but suction pressure is low. What's the likely issue?"
- Type "quiz" for quick concept checks
- Type "hotspot" for component identification

Output format: {"slides": [...], "checkpoints": [...]}

Each checkpoint: {
  "type": "quiz" | "scenario" | "hotspot",
  "afterSlide": number (0-based slide index this checkpoint follows),
  "question": string,
  "options": string[] (3-4 options),
  "answer": number (0-based),
  "explanation": string
}

═══ PHOTO PROMPT RULES ═══

bgPrompt — for gpt-image-1:
- EQUIPMENT ONLY. No people, no hands, no faces.
- Close-up shots of tools, components, panels, gauges.
- Real settings: residential yards, mechanical rooms, training labs.

═══ NARRATION RULES ═══

- Conversational mentor tone. Contractions. "you" and "we."
- EVERY slide MUST have non-empty narration.
- Concept slides: 80-120 words each.
- Flowchart slides: 60-90 words each.
- Include diagnostic thinking: "What happens if..." / "On a service call..."

Output JSON only: {"slides":[...], "checkpoints":[...]}`;

  const user = `Create an institutional HVAC training video script using LEARNING CYCLES.

RULES:
- Every slide MUST have non-empty narration.
- Use 3-4 learning cycles. Each cycle = 1 concept slide + 1 flowchart slide.
- Concept narration must be 80-120 words with all 5 parts (topic, explanation, example, application, takeaway).
- Include a "checkpoints" array with diagnostic/quiz interactions after each cycle.
- Include at least one troubleshooting scenario in checkpoints.
- Output 10-12 slides for a 6-8 minute video.
- Output format: {"slides":[...], "checkpoints":[...]}

Lesson: ${lesson.title}
Module: ${lesson.module}
Content: ${lesson.content.substring(0, 4000)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await callGPT(sys, user, true);
      const json = raw.includes('```') ? raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim() : raw;
      const parsed = JSON.parse(json);
      if (!parsed.slides || !Array.isArray(parsed.slides)) throw new Error('Missing slides array');
      // Normalize: ensure every slide has type, narration, and correct field types
      let emptyNarrationCount = 0;
      parsed.slides.forEach((s: any, i: number) => {
        // Infer type from fields if missing
        if (!s.type) {
          if (s.objectives) s.type = 'objective';
          else if (s.questions) s.type = 'quiz';
          else if (s.takeaways) s.type = 'summary';
          else if (s.demoPhotoPrompt || s.demoCallouts) s.type = 'demo';
          else if (s.nodes) s.type = 'flowchart';
          else if (s.diagramPrompt) s.type = 'diagram';
          else if (s.topic && s.explanation) s.type = 'concept';
          else if (s.bullets) s.type = 'bullets';
          else if (i === 0) s.type = 'title';
          else s.type = 'bullets';
        }
        // Ensure array fields are arrays
        for (const k of ['bullets', 'demoCallouts', 'takeaways', 'leftBullets', 'objectives', 'nodes']) {
          if (s[k] && !Array.isArray(s[k])) {
            s[k] = typeof s[k] === 'string' ? s[k].split('\n').filter(Boolean) : [String(s[k])];
          }
        }
        // Ensure quiz questions have proper structure
        if (s.type === 'quiz' && s.questions) {
          s.questions = s.questions.map((q: any) => ({
            question: q.question || '',
            options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
            answer: typeof q.answer === 'number' ? q.answer : 0,
          }));
        }
        // Track empty narration
        if (!s.narration || s.narration.trim().length === 0) {
          emptyNarrationCount++;
          // Build meaningful fallback from slide content
          if (s.type === 'objective') {
            s.narration = `Here are the learning objectives for this lesson. ${(s.objectives || []).join('. ')}.`;
          } else if (s.type === 'quiz') {
            s.narration = `Let's check what you've learned. ${(s.questions || []).map((q: any, qi: number) => `Question ${qi + 1}: ${q.question}`).join('. ')}`;
          } else if (s.type === 'summary') {
            s.narration = `Let's review the key takeaways. ${(s.takeaways || []).join('. ')}.`;
          } else {
            s.narration = s.heading || s.title || s.diagramCaption || s.subtitle || `Slide ${i + 1}`;
          }
        }
        console.log(`      slide ${i}: type=${s.type}, narr=${(s.narration || '').substring(0, 60)}...`);
      });
      // Reject if too many slides had empty narration (GPT didn't follow instructions)
      if (emptyNarrationCount > 2) {
        throw new Error(`${emptyNarrationCount} slides had empty narration — retrying`);
      }
      return parsed;
    } catch (e: any) {
      if (attempt >= 3) throw e;
      process.stdout.write(` retry${attempt}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Failed to generate script after 3 attempts');
}

// ─── Puppeteer — capture animated frames ────────────────────────

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  return browser;
}

/**
 * Capture keyframes at specific timestamps by advancing CSS animations.
 * Returns array of { framePath, timestamp } for each visual state change.
 * Much faster than real-time capture — only screenshots at animation trigger points.
 */
async function captureKeyframes(
  html: string, outDir: string, totalSecs: number, triggerTimes: number[]
): Promise<{ frames: { path: string; time: number }[] }> {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  // Pause all animations initially
  await page.setContent(html, { waitUntil: 'networkidle0' });

  fs.mkdirSync(outDir, { recursive: true });

  // Build capture points: 0s, each trigger time, and 0.3s after each trigger (post-animation)
  const captureTimes = new Set<number>();
  captureTimes.add(0);
  captureTimes.add(0.15); // header fade in
  for (const t of triggerTimes) {
    captureTimes.add(t);
    captureTimes.add(Math.min(t + 0.45, totalSecs)); // after animation completes
  }
  captureTimes.add(totalSecs);

  const sorted = [...captureTimes].sort((a, b) => a - b);
  const frames: { path: string; time: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    // Advance all animations to this timestamp
    await page.evaluate((ms) => {
      document.getAnimations().forEach(a => {
        a.currentTime = ms;
      });
    }, t * 1000);
    await new Promise(r => setTimeout(r, 50)); // let paint settle

    const fp = path.join(outDir, `kf_${String(i).padStart(3, '0')}.png`);
    await page.screenshot({ path: fp, type: 'png' });
    frames.push({ path: fp, time: t });
  }

  await page.close();
  return { frames };
}

// ─── Video assembly ─────────────────────────────────────────────

/**
 * Build a video segment from keyframes + audio.
 * Each keyframe is held until the next one, creating the animation effect.
 * Ken Burns zoom applied over the whole segment.
 */
function buildSegment(
  keyframes: { path: string; time: number }[],
  audioPath: string, segOut: string, totalDur: number, segIdx: number
): void {
  const tmp = path.dirname(segOut);

  if (keyframes.length <= 1) {
    // Single frame — Ken Burns + audio
    const img = keyframes[0]?.path || audioPath;
    const frames = Math.ceil((totalDur + 0.5) * FPS);
    const zIn = segIdx % 2 === 0;
    execSync(
      `ffmpeg -y -loop 1 -i "${img}" -i "${audioPath}" ` +
      `-filter_complex "[0:v]scale=${W * 2}:${H * 2},` +
      `zoompan=z='${zIn ? 1.0 : 1.05}+(${zIn ? 0.05 : -0.05})*on/${frames}':` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
      `d=${frames}:s=${W}x${H}:fps=${FPS},format=yuv420p[v]" ` +
      `-map "[v]" -map 1:a -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k ` +
      `-shortest -t ${totalDur + 0.5} "${segOut}"`,
      { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    );
    return;
  }

  // Build concat file: each keyframe held until the next timestamp
  const parts: string[] = [];
  for (let i = 0; i < keyframes.length; i++) {
    const kf = keyframes[i];
    const nextTime = i < keyframes.length - 1 ? keyframes[i + 1].time : totalDur + 0.3;
    const holdDur = Math.max(0.033, nextTime - kf.time); // at least 1 frame
    const partPath = path.join(tmp, `part_${segIdx}_${i}.mp4`);

    // Each keyframe image held for its duration with slight Ken Burns
    const partFrames = Math.ceil(holdDur * FPS);
    const zIn = segIdx % 2 === 0;
    const zRange = 0.03;
    const progress = kf.time / Math.max(1, totalDur);
    const z0 = zIn ? (1.0 + progress * zRange) : (1.0 + zRange - progress * zRange);
    const z1 = zIn ? (1.0 + (progress + holdDur / totalDur) * zRange) : (1.0 + zRange - (progress + holdDur / totalDur) * zRange);
    const xd = [4, -4, 0, 3, -3][segIdx % 5];
    const xProgress = progress * totalDur;

    execSync(
      `ffmpeg -y -loop 1 -i "${kf.path}" ` +
      `-filter_complex "[0:v]scale=${W * 2}:${H * 2},` +
      `zoompan=z='${z0.toFixed(4)}+(${(z1 - z0).toFixed(4)})*on/${partFrames}':` +
      `x='iw/2-(iw/zoom/2)+${xd}*${xProgress.toFixed(2)}/${totalDur.toFixed(2)}+${xd}*on/${partFrames}/${totalDur.toFixed(2)}':` +
      `y='ih/2-(ih/zoom/2)':` +
      `d=${partFrames}:s=${W}x${H}:fps=${FPS},format=yuv420p[v]" ` +
      `-map "[v]" -c:v libx264 -preset fast -crf 23 -t ${holdDur.toFixed(3)} "${partPath}"`,
      { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    );
    parts.push(partPath);
  }

  // Concat all parts
  const concatFile = path.join(tmp, `concat_${segIdx}.txt`);
  fs.writeFileSync(concatFile, parts.map(p => `file '${p}'`).join('\n'));
  const noAudio = path.join(tmp, `noaudio_${segIdx}.mp4`);
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${noAudio}"`, { stdio: 'pipe' });

  // Add audio
  execSync(
    `ffmpeg -y -i "${noAudio}" -i "${audioPath}" ` +
    `-c:v copy -c:a aac -b:a 192k -shortest "${segOut}"`,
    { stdio: 'pipe' }
  );

  // Cleanup
  parts.forEach(p => { try { fs.unlinkSync(p); } catch {} });
  try { fs.unlinkSync(concatFile); } catch {}
  try { fs.unlinkSync(noAudio); } catch {}
}

function concatSegments(segs: string[], out: string): void {
  const tmp = path.dirname(out);
  const raw = path.join(tmp, 'raw_concat.mp4');
  const cf = path.join(tmp, 'final_concat.txt');
  fs.writeFileSync(cf, segs.map(s => `file '${s}'`).join('\n'));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${cf}" -c copy "${raw}"`, { stdio: 'pipe' });
  // Add 2.5s hold on last frame with silent audio for a clean ending
  execSync(`ffmpeg -y -i "${raw}" -vf "tpad=stop_mode=clone:stop_duration=2.5" -af "apad=pad_dur=2.5" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${out}"`, { stdio: 'pipe' });
  try { fs.unlinkSync(cf); fs.unlinkSync(raw); } catch {}
}

// ─── Pipeline ───────────────────────────────────────────────────

async function processLesson(
  lesson: { defId: string; uuid: string; title: string; module: string; content: string },
  idx: number, total: number
): Promise<{ success: boolean; path?: string; dur?: number; error?: string }> {
  const wd = path.join(OUT_DIR, lesson.defId);
  fs.mkdirSync(wd, { recursive: true });
  const out = path.join(OUT_DIR, `${lesson.uuid}.mp4`);

  if (fs.existsSync(out)) {
    const d = audioDur(out);
    console.log(`  [${idx}/${total}] SKIP ${lesson.title} — ${Math.round(d)}s`);
    return { success: true, path: out, dur: d };
  }

  try {
    console.log(`\n  [${idx}/${total}] ${lesson.title}`);
    process.stdout.write('    Script...');
    const script = await genScript(lesson);
    console.log(` ${script.slides.length} slides`);

    const segments: string[] = [];

    for (let i = 0; i < script.slides.length; i++) {
      const sl = script.slides[i];
      const slideDir = path.join(wd, `slide_${i}`);
      const audP = path.join(wd, `audio_${i}.mp3`);
      const segP = path.join(wd, `seg_${i}.mp4`);

      if (fs.existsSync(segP)) {
        process.stdout.write(`    Slide ${i + 1}/${script.slides.length} [${sl.type}] cached\n`);
        segments.push(segP);
        continue;
      }

      process.stdout.write(`    Slide ${i + 1}/${script.slides.length} [${sl.type}]`);

      // Generate TTS first to know duration
      if (!fs.existsSync(audP)) {
        process.stdout.write(' tts');
        await genTTS(sl.narration, audP);
      }
      const dur = audioDur(audP);

      // Generate background photo (demo slides handle their own photo)
      let bg64 = '';
      const noBgTypes = ['diagram', 'demo', 'objective', 'quiz'];
      if (!noBgTypes.includes(sl.type) && sl.bgPrompt) {
        const bgPath = path.join(wd, `bg_${i}.jpg`);
        if (!fs.existsSync(bgPath)) {
          process.stdout.write(' photo');
          await genPhoto(
            `A real photograph: ${sl.bgPrompt}. Natural lighting, sharp focus, vibrant colors. No people, no hands, no faces, no human figures. Equipment and environment only. No text, no watermarks, no logos.`,
            bgPath
          );
        }
        bg64 = fs.readFileSync(bgPath).toString('base64');
      }

      // Calculate bullet/callout timing synced to narration
      const itemCount = sl.type === 'concept'
        ? [sl.explanation, sl.example, sl.application, sl.takeaway].filter(Boolean).length
        : (sl.nodes || sl.objectives || sl.questions || sl.bullets || sl.leftBullets || sl.demoCallouts || sl.takeaways || []).length;
      const delays = calcBulletDelays(itemCount, dur);

      // Collect animation trigger times for keyframe capture
      const triggerTimes = [0.1, 0.3, 0.5, ...delays, ...delays.map(d => d + 0.45)];

      // Build HTML
      let html = '';
      switch (sl.type) {
        case 'title':
          html = titleSlideHTML(sl.title || '', sl.subtitle || '', bg64); break;
        case 'section':
          html = sectionSlideHTML(sl.sectionNumber || '', sl.sectionTitle || '', bg64); break;
        case 'concept': {
          // Concept slide: topic as heading, explanation/example/application/takeaway as bullets
          const conceptBullets = [
            sl.explanation,
            sl.example ? `Example: ${sl.example}` : null,
            sl.application ? `Application: ${sl.application}` : null,
            sl.takeaway ? `Key Takeaway: ${sl.takeaway}` : null,
          ].filter(Boolean) as string[];
          html = bulletsSlideHTML(sl.topic || sl.heading || '', conceptBullets, bg64, delays);
          break;
        }
        case 'bullets':
          html = bulletsSlideHTML(sl.heading || '', sl.bullets || [], bg64, delays); break;
        case 'demo': {
          const demoPhoto = path.join(wd, `demo_${i}.jpg`);
          if (!fs.existsSync(demoPhoto)) {
            process.stdout.write(' demo-photo');
            await genPhoto(
              `A real photograph: ${sl.demoPhotoPrompt}. Natural lighting, sharp focus, vibrant colors. No people, no hands, no faces, no human figures. Show only equipment, tools, and components. No text, no watermarks, no logos.`,
              demoPhoto
            );
          }
          const photo64 = fs.readFileSync(demoPhoto).toString('base64');
          html = demoSlideHTML(photo64, sl.demoCallouts || [], delays);
          break;
        }
        case 'diagram':
        case 'flowchart': {
          // If GPT provided nodes array, use the flowchart template (component breakdown with arrows)
          if (sl.nodes && Array.isArray(sl.nodes) && sl.nodes.length > 0) {
            html = flowchartSlideHTML(sl.heading || sl.diagramCaption || '', sl.nodes, delays);
          } else {
            // Fallback to DALL-E generated diagram
            const dg = path.join(wd, `diag_${i}.png`);
            if (!fs.existsSync(dg)) {
              process.stdout.write(' diag');
              await genDiagram(`Clean professional HVAC technical diagram, white background, labeled components, arrows, annotations. ${sl.diagramPrompt}. No people, no photos.`, dg);
            }
            html = diagramSlideHTML(sl.diagramCaption || '', fs.readFileSync(dg).toString('base64'));
          }
          break;
        }
        case 'split': {
          const dg = path.join(wd, `diag_${i}.png`);
          if (!fs.existsSync(dg)) {
            process.stdout.write(' diag');
            await genDiagram(`Clean HVAC technical diagram, white background, labeled. ${sl.rightDiagramPrompt}. No people.`, dg);
          }
          html = splitSlideHTML(sl.leftHeading || '', sl.leftBullets || [], fs.readFileSync(dg).toString('base64'), bg64, delays);
          break;
        }
        case 'summary':
          html = summarySlideHTML(sl.takeaways || [], bg64, delays); break;
        case 'objective':
          html = objectiveSlideHTML(sl.lessonTitle || sl.title || '', sl.objectives || [], delays); break;
        case 'quiz':
          html = quizSlideHTML(sl.questions || [], delays); break;
        default:
          html = bulletsSlideHTML(sl.heading || '', sl.bullets || [], bg64, delays);
      }

      // Capture keyframes at animation trigger points
      process.stdout.write(' anim');
      fs.mkdirSync(slideDir, { recursive: true });
      const { frames: keyframes } = await captureKeyframes(html, slideDir, dur, triggerTimes);

      // Build video segment from keyframes + audio
      process.stdout.write(' encode');
      buildSegment(keyframes, audP, segP, dur, i);

      // Cleanup keyframe images
      keyframes.forEach(kf => { try { fs.unlinkSync(kf.path); } catch {} });

      process.stdout.write(` ${Math.round(dur)}s\n`);
      segments.push(segP);
    }

    process.stdout.write('    Final assembly...');
    concatSegments(segments, out);
    const td = audioDur(out);
    console.log(` ${Math.round(td)}s total`);

    // Save quiz questions to lesson record for interactive post-video quiz
    const quizSlide = script.slides.find((s: any) => s.type === 'quiz' && s.questions);
    if (quizSlide?.questions?.length) {
      const quizData = quizSlide.questions.map((q: any, i: number) => ({
        id: `vq-${i}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.answer,
      }));
      await supabase.from('training_lessons').update({ quiz_questions: quizData }).eq('id', lesson.uuid);
      process.stdout.write(`    Saved ${quizData.length} quiz questions to lesson\n`);
    }

    // Cleanup work dir
    try { fs.rmSync(wd, { recursive: true }); } catch {}
    return { success: true, path: out, dur: td };
  } catch (err: any) {
    console.error(`    ERROR: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const arg = process.argv[2];

  const lessons: Array<{ defId: string; uuid: string; title: string; module: string; content: string }> = [];
  for (const mod of HVAC_DEF.modules) {
    for (const l of mod.lessons) {
      if (l.type !== 'video') continue;
      const uuid = HVAC_LESSON_UUID[l.id];
      const { data } = await supabase.from('training_lessons').select('content').eq('id', uuid).single();
      let c = data?.content || '';
      if (isPlaceholderContent(c)) c = buildLessonContent(l.id);
      c = c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      lessons.push({ defId: l.id, uuid, title: l.title, module: mod.title, content: c });
    }
  }

  if (arg) {
    const l = lessons.find(x => x.defId === arg);
    if (!l) { console.error(`Unknown: ${arg}`); process.exit(1); }
    await processLesson(l, 1, 1);
  } else {
    console.log(`═══ HVAC Video Generator v6 — ${lessons.length} lessons ═══\n`);
    let ok = 0, fail = 0;
    for (let i = 0; i < lessons.length; i++) {
      const r = await processLesson(lessons[i], i + 1, lessons.length);
      r.success ? ok++ : fail++;
    }
    console.log(`\nDone: ${ok} ok, ${fail} failed`);
  }

  if (browser) await browser.close();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
