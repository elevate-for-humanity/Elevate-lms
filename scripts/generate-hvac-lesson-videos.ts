/**
 * HVAC Lesson Video Generator
 *
 * Uses the existing lesson-video-renderer + lesson-script-generator pipeline.
 * Produces professional 1920x1080 slide-based videos:
 *   - Instructor photo (Marcus Johnson) lower-right
 *   - Branded slide layout with accent bars and bullets
 *   - GPT-4o narration script from DB lesson content
 *   - TTS audio (onyx voice, 0.85x speed)
 *   - Uploaded to Supabase course-videos bucket
 *   - video_url updated on course_lessons row
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/generate-hvac-lesson-videos.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/generate-hvac-lesson-videos.ts --start 0 --limit 5
 *   npx tsx --env-file=.env.local scripts/generate-hvac-lesson-videos.ts
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load .env.local before anything else
(function loadEnv() {
  const envFile = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const raw of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && val && !process.env[key]) process.env[key] = val;
  }
})();

const HVAC_COURSE_ID = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';
const INSTRUCTOR_IMAGE = path.join(
  process.cwd(),
  'public/images/team/instructors/instructor-trades.jpg',
);
const INSTRUCTOR_NAME = 'Marcus Johnson';
const INSTRUCTOR_TITLE = 'HVAC Master Technician';
const COURSE_NAME = 'HVAC Technician — EPA 608 Certification';
const TEMP_DIR = path.join(process.cwd(), 'temp/hvac-lesson-videos');
const W = 1920;
const H = 1080;
const FPS = 30;
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

// Initialized lazily after env is loaded
let supabase: ReturnType<typeof createClient>;
let openai: OpenAI;

// ── Accent colors per segment ────────────────────────────────────────
const ACCENTS: Record<string, string> = {
  intro: '#3b82f6',
  concept: '#8b5cf6',
  visual: '#10b981',
  application: '#f59e0b',
  wrapup: '#3b82f6',
};

interface Slide {
  segment: 'intro' | 'concept' | 'visual' | 'application' | 'wrapup';
  title: string;
  bullets: string[];
  narration: string;
}

interface LessonPlan {
  slides: Slide[];
  totalWords: number;
  estSeconds: number;
}

// ── Strip HTML ───────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ── GPT-4o: Generate structured lesson plan ──────────────────────────
async function planLesson(
  title: string,
  content: string,
  lessonNum: number,
  moduleTitle: string,
  nextTitle?: string,
): Promise<LessonPlan> {
  const plain = stripHtml(content).slice(0, 6000);

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `You are writing a professional instructional video script for the Elevate for Humanity HVAC Technician Training Program (EPA 608 certification prep).

Lesson ${lessonNum}: "${title}" — Module: "${moduleTitle}"
${nextTitle ? `Next lesson: "${nextTitle}"` : ''}

LESSON CONTENT:
${plain || 'No content yet — generate from the lesson title and EPA 608 context.'}

Produce a 5-segment lesson script. Return JSON only, no markdown:

{
  "slides": [
    {
      "segment": "intro",
      "title": "2-5 word slide heading",
      "bullets": ["3-4 short bullets, study-guide style"],
      "narration": "~50 words. Warm greeting, state lesson title, what student will learn, why it matters for EPA 608 or their career."
    },
    {
      "segment": "concept",
      "title": "Core concept heading",
      "bullets": ["4-6 key points"],
      "narration": "~300 words. Deep explanation. Use plain language. Cover the core technical content thoroughly. Slow, educational pace."
    },
    {
      "segment": "visual",
      "title": "System / Diagram heading",
      "bullets": ["3-5 visual reference points"],
      "narration": "~150 words. Walk through how the system or component looks and works. Reference what a technician would see on the job."
    },
    {
      "segment": "application",
      "title": "On the Job",
      "bullets": ["3-4 real-world application points"],
      "narration": "~100 words. How this applies on a real job site. What mistakes to avoid. What the EPA 608 exam tests on this topic."
    },
    {
      "segment": "wrapup",
      "title": "Lesson Summary",
      "bullets": ["3-4 key takeaways"],
      "narration": "~50 words. Recap the main points. ${nextTitle ? `Preview next lesson: ${nextTitle}.` : 'Direct student to the quiz below.'}"
    }
  ]
}`,
      },
    ],
  });

  const raw = res.choices[0].message.content || '';
  const cleaned = raw
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const plan = JSON.parse(cleaned);

  const totalWords = plan.slides.reduce(
    (sum: number, s: Slide) => sum + s.narration.split(/\s+/).length,
    0,
  );
  const estSeconds = Math.ceil(totalWords / 2.4); // ~144 WPM at 0.85x speed

  return { slides: plan.slides, totalWords, estSeconds };
}

// ── TTS: Generate audio for a narration segment ──────────────────────
async function generateAudio(text: string, outPath: string): Promise<number> {
  const resp = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'onyx',
    input: text.slice(0, 4096),
    speed: 0.85,
    response_format: 'mp3',
  });
  fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  // Probe duration
  try {
    const dur = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outPath}"`,
      { encoding: 'utf-8' },
    ).trim();
    return parseFloat(dur) || 30;
  } catch {
    return 30;
  }
}

// ── Pollinations.ai: free AI image, no key needed ────────────────────
// Returns a URL that resolves to a JPEG — download it before use
function pollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(
    `${prompt}, professional photography, cinematic lighting, 16:9, high quality, no text`,
  );
  return `https://image.pollinations.ai/prompt/${encoded}?width=1792&height=1024&seed=${seed}&nologo=true`;
}

// Per-segment image prompts for HVAC lessons
function slideImagePrompt(lessonTitle: string, segment: string, bulletSummary: string): string {
  const base = `HVAC technician ${lessonTitle.toLowerCase()}`;
  const segMap: Record<string, string> = {
    intro:       `${base}, professional training facility, instructor and students`,
    concept:     `${base}, technical diagram equipment close-up, professional`,
    visual:      `${base}, hands-on work job site, tools equipment in use`,
    application: `${base}, real-world service call, technician working on unit`,
    wrapup:      `${base}, completed job professional result, certification`,
  };
  return segMap[segment] ?? `${base}, ${bulletSummary.slice(0, 60)}`;
}

// ── Pexels query bank — specific procedural HVAC footage ─────────────
// Each entry has multiple queries tried in order until a clip is found
const HVAC_CLIP_QUERIES: Array<{ match: string[]; queries: string[] }> = [
  // Tools & equipment
  { match: ['tools', 'equipment'],
    queries: ['hvac technician tools manifold gauges', 'hvac service tools refrigerant', 'air conditioning repair tools'] },
  // Refrigerant & refrigeration cycle
  { match: ['refrigerant', 'refrigeration cycle', 'refriger'],
    queries: ['hvac technician charging refrigerant system', 'refrigerant recovery machine hvac', 'air conditioning refrigerant service'] },
  // Compressor
  { match: ['compressor'],
    queries: ['hvac compressor replacement installation', 'air conditioning compressor repair', 'compressor hvac unit outside'] },
  // Pressure / manifold gauges
  { match: ['pressure', 'manifold', 'gauge'],
    queries: ['hvac manifold gauges pressure reading technician', 'hvac technician checking pressure gauges', 'refrigerant pressure gauge hvac service'] },
  // Superheat / subcooling
  { match: ['superheat', 'subcooling'],
    queries: ['hvac technician measuring superheat subcooling', 'hvac gauges rooftop unit charging', 'air conditioning system charging procedure'] },
  // Metering devices / TXV
  { match: ['metering', 'txv', 'expansion valve'],
    queries: ['hvac expansion valve replacement', 'thermostatic expansion valve hvac', 'hvac metering device service'] },
  // Evacuation / vacuum pump
  { match: ['evacuation', 'vacuum', 'micron'],
    queries: ['hvac vacuum pump evacuation procedure', 'vacuum pump connected hvac system', 'hvac deep vacuum micron gauge'] },
  // Recovery
  { match: ['recovery', 'reclaim'],
    queries: ['refrigerant recovery machine hvac technician', 'hvac refrigerant recovery procedure', 'recovery cylinder hvac service'] },
  // Leak detection
  { match: ['leak detection', 'leak detect'],
    queries: ['hvac electronic leak detector technician', 'refrigerant leak detection hvac', 'hvac leak check uv dye'] },
  // Leak repair
  { match: ['leak repair'],
    queries: ['hvac technician repairing refrigerant leak', 'brazing copper pipe hvac repair', 'hvac leak fix service call'] },
  // Electrical / wiring
  { match: ['electrical', 'wiring', 'voltage', 'ohm', 'multimeter', 'amp'],
    queries: ['hvac technician using multimeter electrical', 'hvac control board wiring technician', 'electrician hvac electrical panel testing'] },
  // Capacitors / contactors
  { match: ['capacitor', 'contactor', 'relay'],
    queries: ['hvac capacitor replacement technician', 'hvac contactor replacement air conditioning', 'hvac electrical component replacement'] },
  // Wiring diagrams
  { match: ['wiring diagram', 'schematic'],
    queries: ['hvac technician reading wiring diagram', 'hvac schematic blueprint technician', 'air conditioning wiring diagram service'] },
  // Furnace / gas heating
  { match: ['furnace', 'gas furnace', 'combustion', 'burner'],
    queries: ['gas furnace repair technician', 'hvac technician inspecting furnace burner', 'furnace ignitor flame sensor replacement'] },
  // Electric heat / heat strips
  { match: ['electric heat', 'heat strip'],
    queries: ['electric heat strip hvac air handler', 'hvac electric heating element replacement', 'air handler heat strip installation'] },
  // Heat pump
  { match: ['heat pump'],
    queries: ['heat pump hvac technician service', 'heat pump outdoor unit repair', 'hvac heat pump reversing valve'] },
  // Ductwork
  { match: ['ductwork', 'duct', 'duct design'],
    queries: ['hvac ductwork installation sheet metal', 'hvac technician installing ductwork', 'air duct hvac installation'] },
  // Brazing / soldering
  { match: ['brazing', 'solder'],
    queries: ['hvac technician brazing copper refrigerant lines', 'brazing torch copper pipe hvac', 'hvac copper line brazing procedure'] },
  // Line set installation
  { match: ['line set', 'line-set'],
    queries: ['hvac line set installation copper tubing', 'hvac refrigerant line installation', 'mini split line set installation'] },
  // System startup / commissioning
  { match: ['startup', 'commissioning', 'start-up'],
    queries: ['hvac system startup commissioning technician', 'hvac new installation startup procedure', 'air conditioning startup checklist technician'] },
  // Equipment sizing / Manual J
  { match: ['sizing', 'manual j', 'load calc'],
    queries: ['hvac technician measuring home load calculation', 'hvac equipment sizing installation', 'hvac contractor measuring ductwork'] },
  // Troubleshooting
  { match: ['troubleshoot', 'diagnos', 'diagnostic'],
    queries: ['hvac technician troubleshooting air conditioner', 'hvac diagnostic service call repair', 'air conditioning not working technician diagnosing'] },
  // Common AC failures
  { match: ['ac failure', 'common ac', 'frozen coil'],
    queries: ['frozen evaporator coil hvac repair', 'hvac air conditioner not cooling repair', 'hvac technician fixing air conditioner'] },
  // Common heating failures
  { match: ['heating failure', 'common heat'],
    queries: ['furnace not heating repair technician', 'hvac heating system failure repair', 'gas furnace troubleshooting technician'] },
  // Ozone / EPA / environment
  { match: ['ozone', 'clean air act', 'epa 608', 'environmental'],
    queries: ['hvac refrigerant environmental compliance', 'epa 608 certification hvac technician', 'refrigerant handling environmental protection'] },
  // Refrigerant types
  { match: ['refrigerant type', 'r-410', 'r410', 'r-22', 'r22', 'classification'],
    queries: ['refrigerant cylinders hvac types', 'hvac refrigerant cylinder color coded', 'refrigerant types hvac service'] },
  // Safety / OSHA / PPE
  { match: ['osha', 'safety', 'ppe', 'fall protection', 'hazcom'],
    queries: ['hvac technician safety equipment ppe', 'construction worker safety harness rooftop', 'hvac worker safety job site'] },
  // CPR / first aid
  { match: ['cpr', 'first aid', 'aed'],
    queries: ['cpr training first aid workplace', 'first aid cpr certification training', 'emergency response workplace safety'] },
  // Career / resume / interview
  { match: ['career', 'resume', 'interview', 'employer', 'ojt', 'internship'],
    queries: ['hvac technician professional career', 'trades worker job interview professional', 'hvac apprentice on the job training'] },
  // Customer service
  { match: ['customer'],
    queries: ['hvac technician talking to homeowner customer', 'service technician customer communication', 'hvac professional explaining repair customer'] },
  // PPE / components identification
  { match: ['components', 'identification', 'system component'],
    queries: ['hvac system components labeled parts', 'air conditioning unit components technician', 'hvac outdoor indoor unit components'] },
  // How HVAC works / orientation
  { match: ['how hvac', 'hvac system', 'welcome', 'orientation', 'career pathway', 'wioa'],
    queries: ['hvac technician working air conditioning system', 'hvac training program students instructor', 'hvac technician professional job site'] },
];

function pexelsQueries(lessonTitle: string, segment: string): string[] {
  const t = lessonTitle.toLowerCase();
  for (const entry of HVAC_CLIP_QUERIES) {
    if (entry.match.some(k => t.includes(k))) return entry.queries;
  }
  // Segment-level fallbacks
  const segFallbacks: Record<string, string[]> = {
    intro:       ['hvac technician training professional', 'hvac instructor students classroom'],
    concept:     ['hvac system components technical close up', 'air conditioning unit parts'],
    visual:      ['hvac technician working on unit rooftop', 'air conditioning repair service call'],
    application: ['hvac service call technician hands on', 'hvac technician fixing equipment'],
    wrapup:      ['hvac certified technician professional', 'hvac technician completed job'],
  };
  return segFallbacks[segment] ?? ['hvac technician air conditioning repair'];
}

// ── Fetch best matching Pexels clip, trying multiple queries ─────────
const _pexelsCache: Record<string, string | null> = {};

async function searchPexels(query: string): Promise<string | null> {
  if (_pexelsCache[query] !== undefined) return _pexelsCache[query];
  const apiKey = process.env.PEXELS_API_KEY!;
  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=landscape&size=medium&per_page=15`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) { _pexelsCache[query] = null; return null; }
    const data: any = await res.json();
    const videos = (data.videos || []).filter((v: any) => v.duration >= 6 && v.duration <= 60);
    const pool = videos.length ? videos : (data.videos || []);
    if (!pool.length) { _pexelsCache[query] = null; return null; }
    const vid = pool[Math.floor(Math.random() * Math.min(pool.length, 5))];
    const file =
      vid.video_files?.find((f: any) => f.quality === 'hd' && f.width >= 1280) ??
      vid.video_files?.find((f: any) => f.width >= 854) ??
      vid.video_files?.[0];
    _pexelsCache[query] = file?.link ?? null;
    return _pexelsCache[query];
  } catch {
    _pexelsCache[query] = null;
    return null;
  }
}

async function fetchPexelsClip(queries: string[], destPath: string): Promise<boolean> {
  if (!process.env.PEXELS_API_KEY) return false;
  for (const q of queries) {
    const url = await searchPexels(q);
    if (!url) continue;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!r.ok) continue;
      fs.writeFileSync(destPath, Buffer.from(await r.arrayBuffer()));
      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 50000) return true;
    } catch { continue; }
  }
  return false;
}

// ── Download a URL to a local file ───────────────────────────────────
async function downloadFile(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return false;
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch {
    return false;
  }
}

// ── Canvas: Render a slide overlay PNG (text + branding, NO background) ──
// Background is handled by ffmpeg (image or video clip underneath)
async function renderSlideOverlay(
  slide: Slide,
  slideIdx: number,
  totalSlides: number,
  lessonNum: number,
  moduleTitle: string,
  outPath: string,
  instructorImagePath: string,
): Promise<void> {
  const { createCanvas, loadImage } = await import('@napi-rs/canvas');
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Transparent base
  ctx.clearRect(0, 0, W, H);

  // ── Left panel: semi-transparent dark overlay for text readability
  const panelW = Math.round(W * 0.58);
  ctx.fillStyle = 'rgba(10, 15, 30, 0.82)';
  ctx.fillRect(0, 0, panelW, H);

  // ── Top orange brand bar
  ctx.fillStyle = '#f97316';
  ctx.fillRect(0, 0, W, 7);

  // ── Section label
  const SEGMENT_LABELS: Record<string, string> = {
    intro:       'LESSON INTRODUCTION',
    concept:     'CORE CONCEPT',
    visual:      'SYSTEM OVERVIEW',
    application: 'ON THE JOB',
    wrapup:      'LESSON SUMMARY',
  };
  const ACCENT_COLORS: Record<string, string> = {
    intro:       '#3b82f6',
    concept:     '#8b5cf6',
    visual:      '#10b981',
    application: '#f59e0b',
    wrapup:      '#3b82f6',
  };
  const accent = ACCENT_COLORS[slide.segment] || '#3b82f6';
  const sectionLabel = SEGMENT_LABELS[slide.segment] || slide.segment.toUpperCase();

  ctx.fillStyle = accent;
  ctx.font = `bold 22px "${FONT_BOLD}"`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(sectionLabel, 48, 72);

  // ── Slide title
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 50px "${FONT_BOLD}"`;
  const maxTitleW = panelW - 80;
  const titleWords = slide.title.split(' ');
  let titleLine = '';
  let titleY = 112;
  for (const word of titleWords) {
    const test = titleLine + (titleLine ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxTitleW && titleLine) {
      ctx.fillText(titleLine, 48, titleY);
      titleLine = word;
      titleY += 60;
    } else {
      titleLine = test;
    }
  }
  ctx.fillText(titleLine, 48, titleY);

  // ── Accent underline
  ctx.fillStyle = accent;
  ctx.fillRect(48, titleY + 60, 260, 3);

  // ── Bullets
  const bulletStartY = titleY + 88;
  const bulletSpacing = 62;
  const maxBulletW = panelW - 100;
  slide.bullets.slice(0, 5).forEach((bullet, i) => {
    const y = bulletStartY + i * bulletSpacing;
    // Accent dot
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(60, y + 14, 7, 0, Math.PI * 2);
    ctx.fill();
    // Text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `28px "${FONT_REG}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const words = bullet.split(' ');
    let line = '';
    let lineY = y;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxBulletW && line) {
        ctx.fillText(line, 82, lineY);
        line = word;
        lineY += 34;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 82, lineY);
  });

  // ── Instructor photo — bottom-left corner
  const photoSize = 120;
  const photoX = 48;
  const photoY = H - photoSize - 64;
  if (fs.existsSync(instructorImagePath)) {
    try {
      const img = await loadImage(instructorImagePath);
      // Circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
      ctx.restore();
      // Orange ring
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
    } catch { /* skip */ }
  }

  // Instructor name next to photo
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 20px "${FONT_BOLD}"`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(INSTRUCTOR_NAME, photoX + photoSize + 14, photoY + photoSize / 2 - 12);
  ctx.fillStyle = '#94a3b8';
  ctx.font = `18px "${FONT_REG}"`;
  ctx.fillText(INSTRUCTOR_TITLE, photoX + photoSize + 14, photoY + photoSize / 2 + 12);

  // ── Bottom bar
  ctx.fillStyle = 'rgba(10, 15, 26, 0.90)';
  ctx.fillRect(0, H - 44, W, 44);
  ctx.fillStyle = '#64748b';
  ctx.font = `17px "${FONT_REG}"`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `ELEVATE FOR HUMANITY  ·  HVAC Technician  ·  ${moduleTitle}  ·  Slide ${slideIdx + 1}/${totalSlides}`,
    32, H - 22,
  );

  // ── Progress bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, H - 5, W, 5);
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - 5, Math.round(W * ((slideIdx + 1) / totalSlides)), 5);

  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
}

// ── ffmpeg: Build one segment — Pexels clip or Ken Burns still + overlay + audio ─
function buildSegment(
  overlayPng: string,
  audioMp3: string,
  duration: number,
  outPath: string,
  bgPath: string,
): void {
  const isVideo = bgPath.endsWith('.mp4') || bgPath.endsWith('.mov') || bgPath.endsWith('.webm');
  const fadeOut = Math.max(0, duration - 0.7);
  const totalFrames = Math.ceil(duration * FPS);

  let cmd: string;
  if (isVideo) {
    // Pexels clip: loop → scale/crop to 1280x720 → overlay text PNG → fade in/out
    cmd =
      `ffmpeg -y ` +
      `-stream_loop -1 -t ${duration} -i "${bgPath}" ` +
      `-loop 1 -i "${overlayPng}" ` +
      `-i "${audioMp3}" ` +
      `-filter_complex ` +
        `"[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,` +
        `crop=${W}:${H},setsar=1,setpts=PTS-STARTPTS[bg];` +
        `[1:v]format=rgba[ov];` +
        `[bg][ov]overlay=0:0:format=auto,` +
        `fade=t=in:st=0:d=0.6,` +
        `fade=t=out:st=${fadeOut}:d=0.7,` +
        `format=yuv420p[v]" ` +
      `-map "[v]" -map 2:a ` +
      `-c:v libx264 -preset fast -crf 20 ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-t ${duration} -movflags +faststart "${outPath}"`;
  } else {
    // Still image: Ken Burns slow zoom + pan + overlay + fade in/out
    cmd =
      `ffmpeg -y ` +
      `-loop 1 -t ${duration} -i "${bgPath}" ` +
      `-loop 1 -i "${overlayPng}" ` +
      `-i "${audioMp3}" ` +
      `-filter_complex ` +
        `"[0:v]scale=${W * 2}:${H * 2},` +
        `zoompan=z='min(1.08,zoom+0.0003)':x='iw/2-(iw/zoom/2)+(t*3)':y='ih/2-(ih/zoom/2)':` +
        `d=${totalFrames}:s=${W}x${H}:fps=${FPS},` +
        `setsar=1,setpts=PTS-STARTPTS[bg];` +
        `[1:v]format=rgba[ov];` +
        `[bg][ov]overlay=0:0:format=auto,` +
        `fade=t=in:st=0:d=0.6,` +
        `fade=t=out:st=${fadeOut}:d=0.7,` +
        `format=yuv420p[v]" ` +
      `-map "[v]" -map 2:a ` +
      `-c:v libx264 -preset fast -crf 20 ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-t ${duration} -movflags +faststart "${outPath}"`;
  }
  execSync(cmd, { stdio: 'pipe' });
}

// ── ffmpeg: Clean segment — bg only + audio, no text overlay ─────────
function buildSegmentClean(
  audioMp3: string,
  duration: number,
  outPath: string,
  bgPath: string,
): void {
  const isVideo = bgPath.endsWith('.mp4') || bgPath.endsWith('.mov') || bgPath.endsWith('.webm');
  const fadeOut = Math.max(0, duration - 0.7);
  const totalFrames = Math.ceil(duration * FPS);

  let cmd: string;
  if (isVideo) {
    cmd =
      `ffmpeg -y ` +
      `-stream_loop -1 -t ${duration} -i "${bgPath}" ` +
      `-i "${audioMp3}" ` +
      `-filter_complex ` +
        `"[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,` +
        `crop=${W}:${H},setsar=1,setpts=PTS-STARTPTS,` +
        `fade=t=in:st=0:d=0.6,fade=t=out:st=${fadeOut}:d=0.7,` +
        `format=yuv420p[v]" ` +
      `-map "[v]" -map 1:a ` +
      `-c:v libx264 -preset fast -crf 20 ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-t ${duration} -movflags +faststart "${outPath}"`;
  } else {
    // Ken Burns zoom + pan on still image
    cmd =
      `ffmpeg -y ` +
      `-loop 1 -t ${duration} -i "${bgPath}" ` +
      `-i "${audioMp3}" ` +
      `-filter_complex ` +
        `"[0:v]scale=${W * 2}:${H * 2},` +
        `zoompan=z='min(1.08,zoom+0.0003)':x='iw/2-(iw/zoom/2)+(t*3)':y='ih/2-(ih/zoom/2)':` +
        `d=${totalFrames}:s=${W}x${H}:fps=${FPS},` +
        `setsar=1,setpts=PTS-STARTPTS,` +
        `fade=t=in:st=0:d=0.6,fade=t=out:st=${fadeOut}:d=0.7,` +
        `format=yuv420p[v]" ` +
      `-map "[v]" -map 1:a ` +
      `-c:v libx264 -preset fast -crf 20 ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-t ${duration} -movflags +faststart "${outPath}"`;
  }
  execSync(cmd, { stdio: 'pipe' });
}

// ── ffmpeg: Concatenate segments into final video ────────────────────
function assembleVideo(segmentPaths: string[], outPath: string): void {
  const concatFile = outPath.replace('.mp4', '-concat.txt');
  fs.writeFileSync(concatFile, segmentPaths.map((p) => `file '${p}'`).join('\n'));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${outPath}"`, {
    stdio: 'pipe',
  });
  try {
    fs.unlinkSync(concatFile);
  } catch {}
}

// ── Upload to Supabase storage ───────────────────────────────────────
async function uploadVideo(localPath: string, storagePath: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const mb = buf.length / 1024 / 1024;
  console.log(`    Uploading ${mb.toFixed(1)}MB...`);
  const { error } = await supabase.storage
    .from('course-videos')
    .upload(storagePath, buf, { contentType: 'video/mp4', upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from('course-videos').getPublicUrl(storagePath).data.publicUrl;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  // Init clients after env is loaded
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const forceAll = args.includes('--force');
  const startArg = args.indexOf('--start');
  const limitArg = args.indexOf('--limit');
  const startIdx = startArg >= 0 ? parseInt(args[startArg + 1]) : 0;
  const limit = limitArg >= 0 ? parseInt(args[limitArg + 1]) : 9999;

  console.log('=== HVAC Lesson Video Generator ===\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'} | Start: ${startIdx} | Limit: ${limit}\n`);

  // Fetch lessons
  const { data: lessons, error } = await supabase
    .from('course_lessons')
    .select(
      `
      id, title, content, lesson_type, order_index, video_url,
      module:module_id (title, order_index)
    `,
    )
    .eq('course_id', HVAC_COURSE_ID)
    .order('order_index');

  if (error || !lessons) {
    console.error('DB error:', error?.message);
    process.exit(1);
  }

  // Only lesson-type rows, skip checkpoints
  const allLessons = lessons.filter((l: any) => l.lesson_type === 'lesson');
  // Regenerate if: no video, not in course-videos bucket, or --force
  const needsVideo = (l: any) =>
    forceAll || !l.video_url || !l.video_url.includes('/course-videos/');

  const targets = allLessons.filter(needsVideo).slice(startIdx, startIdx + limit);

  console.log(`Total lesson-type rows: ${allLessons.length}`);
  console.log(
    `Already have real video: ${allLessons.filter((l: any) => l.video_url && !l.video_url.includes('/hvac/videos/')).length}`,
  );
  console.log(`To generate: ${targets.length}\n`);

  if (!dryRun) fs.mkdirSync(TEMP_DIR, { recursive: true });

  let ok = 0,
    skip = 0,
    fail = 0;
  const t0 = Date.now();

  for (let i = 0; i < targets.length; i++) {
    const lesson = targets[i] as any;
    const moduleTitle = lesson.module?.title || 'HVAC Technician';
    const lessonNum = allLessons.indexOf(lesson) + 1;
    const nextLesson = allLessons[allLessons.indexOf(lesson) + 1] as any;

    console.log(`[${i + 1}/${targets.length}] Lesson ${lessonNum}: ${lesson.title}`);

    if (dryRun) {
      console.log(`  Module: ${moduleTitle}`);
      const rawContent =
        typeof lesson.content === 'object'
          ? (lesson.content as any)?.text || ''
          : lesson.content || '';
      console.log(`  Content: ${stripHtml(rawContent).length} chars`);
      console.log(`  Current video: ${lesson.video_url ? 'avatar loop' : 'none'}`);
      continue;
    }

    const dir = path.join(TEMP_DIR, `L${String(lessonNum).padStart(3, '0')}`);
    fs.mkdirSync(dir, { recursive: true });

    try {
      // 1. Plan lesson with GPT-4o
      process.stdout.write('  Planning...');
      const lessonContent =
        typeof lesson.content === 'object'
          ? (lesson.content as any)?.text || ''
          : lesson.content || '';
      const plan = await planLesson(
        lesson.title,
        lessonContent,
        lessonNum,
        moduleTitle,
        nextLesson?.title,
      );
      console.log(
        ` ${plan.totalWords} words, ~${Math.round(plan.estSeconds / 60)}:${String(plan.estSeconds % 60).padStart(2, '0')} min`,
      );

      const segmentPaths: string[] = [];

      // 2. Generate each slide — Pexels clip per segment, Ken Burns fallback
      for (let s = 0; s < plan.slides.length; s++) {
        const slide = plan.slides[s];
        process.stdout.write(`  [${slide.segment}] TTS...`);

        // TTS narration
        const audioPath = path.join(dir, `audio-${s}.mp3`);
        const duration = await generateAudio(slide.narration, audioPath);
        process.stdout.write(` ${duration.toFixed(0)}s`);

        // Pexels video clip — try multiple specific queries per topic
        const clipPath = path.join(dir, `clip-${s}.mp4`);
        const queries = pexelsQueries(lesson.title, slide.segment);
        process.stdout.write(` | Clip...`);
        const gotClip = await fetchPexelsClip(queries, clipPath);
        process.stdout.write(gotClip ? ' ✓' : ' (img fallback)');

        // Pollinations image fallback when no clip
        let bgPath = clipPath;
        if (!gotClip) {
          const imgPath = path.join(dir, `bg-${s}.jpg`);
          const prompt = slideImagePrompt(lesson.title, slide.segment, slide.bullets[0] ?? '');
          const seed = lessonNum * 10 + s;
          const imgUrl = pollinationsUrl(prompt, seed);
          process.stdout.write(` | Img...`);
          const ok = await downloadFile(imgUrl, imgPath);
          bgPath = ok ? imgPath : INSTRUCTOR_IMAGE; // absolute last fallback
          process.stdout.write(ok ? ' ✓' : ' (default)');
        }

        // Assemble segment — no overlay, pure visual + audio
        process.stdout.write(` | Seg...`);
        const segPath = path.join(dir, `seg-${s}.mp4`);
        buildSegmentClean(audioPath, duration, segPath, bgPath);
        segmentPaths.push(segPath);
        console.log(' ✓');
      }

      // 3. Assemble
      process.stdout.write('  Assembling...');
      const finalPath = path.join(dir, 'final.mp4');
      assembleVideo(segmentPaths, finalPath);
      const finalMb = fs.statSync(finalPath).size / 1024 / 1024;
      console.log(` ${finalMb.toFixed(1)}MB`);

      // 4. Upload
      const storagePath = `hvac/lesson-${lesson.id}-v2.mp4`;
      const url = await uploadVideo(finalPath, storagePath);

      // 5. Update DB
      await supabase
        .from('course_lessons')
        .update({ video_url: url, duration_minutes: Math.round(plan.estSeconds / 60) })
        .eq('id', lesson.id);

      console.log(`  ✅ ${url.slice(0, 80)}...`);
      ok++;
    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
      fail++;
    } finally {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}
    }
  }

  try {
    if (!dryRun) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch {}

  const elapsed = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n=== DONE === ${ok} generated | ${skip} skipped | ${fail} failed | ${elapsed} min`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
