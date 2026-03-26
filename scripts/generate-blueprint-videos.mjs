/**
 * scripts/generate-blueprint-videos.mjs
 *
 * Generates lesson videos for every blueprint lesson using:
 *   1. GPT-4o  — unique lesson script per lesson title + module context
 *   2. OpenAI TTS (onyx) — MP3 audio from script
 *   3. DALL-E 3 — unique background image per lesson
 *   4. ffmpeg  — avatar clip (left 960px) + background (right 960px) + orange bar + title
 *
 * No HeyGen credits required. Uses existing avatar clips in public/hvac/heygen/.
 * Skip-if-exists: safe to re-run, never overwrites completed videos.
 *
 * Usage:
 *   node scripts/generate-blueprint-videos.mjs
 *   node scripts/generate-blueprint-videos.mjs --lesson hvac-foundations-01
 *   node scripts/generate-blueprint-videos.mjs --module hvac-foundations
 *   node scripts/generate-blueprint-videos.mjs --dry-run
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}
if (!process.env.OPENAI_API_KEY) { console.error("OPENAI_API_KEY not set"); process.exit(1); }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUTPUT_DIR = path.resolve(__dirname, "../public/hvac/videos");
const TEMP_DIR   = path.resolve(__dirname, "../.tmp/video-gen");
const AVATAR_DIR = path.resolve(__dirname, "../public/hvac/heygen");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR,   { recursive: true });

// Pick largest avatar clip as base loop
const avatarClips = fs.readdirSync(AVATAR_DIR).filter(f => f.endsWith(".mp4"));
if (!avatarClips.length) { console.error("No avatar clips in public/hvac/heygen/"); process.exit(1); }
const AVATAR_CLIP = path.join(AVATAR_DIR,
  avatarClips.map(f => ({ f, size: fs.statSync(path.join(AVATAR_DIR, f)).size }))
    .sort((a, b) => b.size - a.size)[0].f
);

const args = process.argv.slice(2);
const lessonFilter = args.includes("--lesson") ? args[args.indexOf("--lesson") + 1] : null;
const moduleFilter = args.includes("--module") ? args[args.indexOf("--module") + 1] : null;
const dryRun       = args.includes("--dry-run");

const MODULES = [
  { slug: "hvac-foundations", title: "HVAC Foundations and Career Orientation", lessons: [
    { slug: "hvac-foundations-01", title: "Introduction to HVAC Systems" },
    { slug: "hvac-foundations-02", title: "Heating, Cooling, and Ventilation Basics" },
    { slug: "hvac-foundations-03", title: "Common Components and System Types" },
    { slug: "hvac-foundations-04", title: "Career Paths and EPA 608 Overview" },
  ]},
  { slug: "hvac-safety-tools", title: "Safety, Tools, and Professional Practice", lessons: [
    { slug: "hvac-safety-01", title: "HVAC Safety Fundamentals" },
    { slug: "hvac-safety-02", title: "PPE, Lockout/Tagout, and Hazard Awareness" },
    { slug: "hvac-safety-03", title: "Hand Tools and Power Tools" },
    { slug: "hvac-safety-04", title: "Meters, Gauges, and Diagnostic Instruments" },
    { slug: "hvac-safety-05", title: "Workplace Professionalism and Documentation" },
  ]},
  { slug: "hvac-basic-science", title: "Basic Science for HVAC", lessons: [
    { slug: "hvac-science-01", title: "Heat, Temperature, and Transfer" },
    { slug: "hvac-science-02", title: "Pressure and Vacuum Basics" },
    { slug: "hvac-science-03", title: "States of Matter and Refrigerant Behavior" },
    { slug: "hvac-science-04", title: "Measurement Concepts for HVAC" },
    { slug: "hvac-science-05", title: "Applied Science Scenarios" },
  ]},
  { slug: "refrigeration-cycle", title: "Refrigeration Cycle and System Components", lessons: [
    { slug: "refrig-cycle-01", title: "The Refrigeration Cycle Explained" },
    { slug: "refrig-cycle-02", title: "Compressors and Their Function" },
    { slug: "refrig-cycle-03", title: "Condensers and Heat Rejection" },
    { slug: "refrig-cycle-04", title: "Metering Devices and Flow Control" },
    { slug: "refrig-cycle-05", title: "Evaporators and Heat Absorption" },
    { slug: "refrig-cycle-06", title: "Reading the Whole System" },
  ]},
  { slug: "refrigerant-handling", title: "Refrigerants, Recovery, Recycling, and Charging", lessons: [
    { slug: "refrig-handling-01", title: "Refrigerant Types and Characteristics" },
    { slug: "refrig-handling-02", title: "Environmental Impact and Regulatory Context" },
    { slug: "refrig-handling-03", title: "Recovery, Recycling, and Reclamation" },
    { slug: "refrig-handling-04", title: "Cylinder Safety and Refrigerant Handling" },
    { slug: "refrig-handling-05", title: "Evacuation and Charging Fundamentals" },
    { slug: "refrig-handling-06", title: "Common Handling Errors" },
  ]},
  { slug: "epa-608-regulations", title: "EPA 608 Regulatory Core", lessons: [
    { slug: "epa-regs-01", title: "EPA 608 Regulatory Framework" },
    { slug: "epa-regs-02", title: "Technician Certification Rules" },
    { slug: "epa-regs-03", title: "Prohibited Practices and Violations" },
    { slug: "epa-regs-04", title: "Recordkeeping and Compliance Basics" },
    { slug: "epa-regs-05", title: "Regulation Review Drill" },
  ]},
  { slug: "epa-608-type-1", title: "Type I — Small Appliances", lessons: [
    { slug: "type1-01", title: "What Counts as Type I Equipment" },
    { slug: "type1-02", title: "Type I Recovery Requirements" },
    { slug: "type1-03", title: "Servicing Small Appliances Safely" },
    { slug: "type1-04", title: "Type I Exam Scenarios" },
  ]},
  { slug: "epa-608-type-2", title: "Type II — High-Pressure Appliances", lessons: [
    { slug: "type2-01", title: "Understanding Type II Appliances" },
    { slug: "type2-02", title: "Recovery and Leak Repair Requirements" },
    { slug: "type2-03", title: "Service Procedures for High-Pressure Systems" },
    { slug: "type2-04", title: "Type II Exam Scenarios" },
  ]},
  { slug: "epa-608-type-3", title: "Type III — Low-Pressure Appliances", lessons: [
    { slug: "type3-01", title: "Understanding Type III Appliances" },
    { slug: "type3-02", title: "Low-Pressure System Service Rules" },
    { slug: "type3-03", title: "Recovery and Evacuation for Type III" },
    { slug: "type3-04", title: "Type III Exam Scenarios" },
  ]},
  { slug: "epa-608-universal-review", title: "Universal Certification Review", lessons: [
    { slug: "universal-01", title: "Universal Exam Structure and Strategy" },
    { slug: "universal-02", title: "Cross-Type Review and Comparison" },
    { slug: "universal-03", title: "Common Mistakes and Trap Questions" },
  ]},
  { slug: "final-assessment", title: "Final Assessment and Remediation", lessons: [
    { slug: "final-practice-exam", title: "Final EPA 608 Practice Exam" },
    { slug: "final-score-review",  title: "Score Review and Weakness Analysis" },
    { slug: "final-remediation",   title: "Targeted Remediation Lesson" },
  ]},
];

let allLessons = [];
for (const mod of MODULES) {
  if (moduleFilter && mod.slug !== moduleFilter) continue;
  for (const lesson of mod.lessons) {
    if (lessonFilter && lesson.slug !== lessonFilter) continue;
    allLessons.push({ ...lesson, moduleTitle: mod.title });
  }
}
const toGenerate = allLessons.filter(l => !fs.existsSync(path.join(OUTPUT_DIR, `${l.slug}.mp4`)));

console.log(`\n── HVAC Video Generator (TTS + ffmpeg) ─────────────────`);
console.log(`Avatar : ${path.basename(AVATAR_CLIP)}`);
console.log(`Total  : ${allLessons.length}  Done: ${allLessons.length - toGenerate.length}  To do: ${toGenerate.length}`);
if (dryRun) { toGenerate.forEach(l => console.log(`  ${l.slug}`)); process.exit(0); }
if (!toGenerate.length) { console.log("All done."); process.exit(0); }
console.log("─────────────────────────────────────────────────────────\n");

async function generateScript(lesson) {
  const r = await openai.chat.completions.create({ model: "gpt-4o", max_tokens: 800,
    messages: [{ role: "user", content: `Write a 4-minute spoken HVAC lesson script.
Lesson: "${lesson.title}" | Module: "${lesson.moduleTitle}"
Structure: Hook (30s) → Core concept (90s) → Step-by-step (90s) → Key takeaway (30s)
Tone: Marcus Johnson, direct experienced HVAC instructor. No markdown. ~500 words.` }] });
  return r.choices[0].message.content.trim();
}

async function generateImagePrompt(lesson) {
  const r = await openai.chat.completions.create({ model: "gpt-4o", max_tokens: 120,
    messages: [{ role: "user", content: `DALL-E 3 prompt for HVAC training video background. Lesson: "${lesson.title}". Photorealistic, professional HVAC equipment, 16:9, no text, no people, bright lighting. Return only the prompt.` }] });
  return r.choices[0].message.content.trim();
}

async function generateBackground(prompt, slug) {
  const p = path.join(TEMP_DIR, `${slug}-bg.png`);
  if (fs.existsSync(p)) return p;
  const r = await openai.images.generate({ model: "dall-e-3", prompt, size: "1792x1024", quality: "standard", n: 1 });
  fs.writeFileSync(p, Buffer.from(await (await fetch(r.data[0].url)).arrayBuffer()));
  return p;
}

async function generateAudio(script, slug) {
  const p = path.join(TEMP_DIR, `${slug}.mp3`);
  if (fs.existsSync(p)) return p;
  const r = await openai.audio.speech.create({ model: "tts-1-hd", voice: "onyx", input: script, speed: 0.95 });
  fs.writeFileSync(p, Buffer.from(await r.arrayBuffer()));
  return p;
}

function getAudioDuration(mp3) {
  const r = spawnSync("ffprobe", ["-v","quiet","-show_entries","format=duration","-of","csv=p=0", mp3]);
  return parseFloat(r.stdout.toString().trim()) || 240;
}

function assembleVideo(audioPath, bgPath, title, slug) {
  const out = path.join(OUTPUT_DIR, `${slug}.mp4`);
  const dur = getAudioDuration(audioPath);
  const t = title.replace(/[\x27:]/g, " ").replace(/\s+/g, " ").trim();
  const filter = [
    "[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080,setsar=1[av]",
    "[1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080,setsar=1[bg]",
    "[av][bg]hstack=inputs=2[base]",
    "[base]drawbox=x=0:y=0:w=1920:h=8:color=#f97316:t=fill[bar]",
    `[bar]drawtext=text='${t}':fontcolor=white:fontsize=36:x=40:y=h-90:shadowcolor=black:shadowx=2:shadowy=2[tt]`,
    "[tt]drawtext=text='Elevate for Humanity':fontcolor=white@0.6:fontsize=22:x=40:y=h-52:shadowcolor=black:shadowx=1:shadowy=1[out]",
  ].join(";");
  const r = spawnSync("ffmpeg", [
    "-y", "-stream_loop","-1","-i", AVATAR_CLIP,
    "-i", bgPath, "-i", audioPath,
    "-filter_complex", filter,
    "-map","[out]","-map","2:a",
    "-t", String(dur),
    "-c:v","libx264","-preset","fast","-crf","22",
    "-c:a","aac","-b:a","128k","-movflags","+faststart",
    out,
  ], { stdio: ["ignore","pipe","pipe"] });
  if (r.status !== 0) throw new Error(r.stderr?.toString().slice(-300) || "ffmpeg failed");
  const mb = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
  return { out, dur: dur.toFixed(0), mb };
}

async function main() {
  let done = 0, failed = 0;
  for (const lesson of toGenerate) {
    console.log(`\n[${done+failed+1}/${toGenerate.length}] ${lesson.slug} — ${lesson.title}`);
    try {
      process.stdout.write("  Script... ");
      const script = await generateScript(lesson);
      console.log(`${script.split(" ").length}w`);

      process.stdout.write("  Image prompt... ");
      const imgPrompt = await generateImagePrompt(lesson);
      console.log("done");

      process.stdout.write("  DALL-E... ");
      const bgPath = await generateBackground(imgPrompt, lesson.slug);
      console.log("done");

      process.stdout.write("  TTS... ");
      const audioPath = await generateAudio(script, lesson.slug);
      console.log("done");

      process.stdout.write("  ffmpeg... ");
      const { out, dur, mb } = assembleVideo(audioPath, bgPath, lesson.title, lesson.slug);
      console.log(`${dur}s ${mb}MB → ${path.relative(process.cwd(), out)}`);
      done++;
    } catch(err) {
      console.error(`  FAILED: ${err.message}`);
      failed++;
    }
  }
  console.log(`\nDone: ${done}  Failed: ${failed}`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
