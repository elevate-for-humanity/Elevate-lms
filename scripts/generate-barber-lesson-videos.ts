#!/usr/bin/env tsx
/**
 * Barber lesson video generator.
 *
 * Per lesson:
 *   1. Split content into scenes by markdown section headers
 *   2. Per scene: pick the b-roll clip that matches the scene topic
 *   3. Per scene: generate TTS narration (gpt-4o-mini-tts, voice: onyx)
 *   4. Per scene: loop the matched b-roll clip to cover the narration duration
 *   5. Concat all scenes → final lesson MP4 with +faststart
 *   6. Update video_url in course_lessons
 *
 * Usage:
 *   pnpm tsx scripts/generate-barber-lesson-videos.ts --slug barber-lesson-1
 *   pnpm tsx scripts/generate-barber-lesson-videos.ts --slug barber-lesson-1 --dry-run
 *   pnpm tsx scripts/generate-barber-lesson-videos.ts --force
 *   pnpm tsx scripts/generate-barber-lesson-videos.ts --missing
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SESSION_KEY_FILE = '/tmp/.openai-session-key';
const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const OUT_DIR = path.join(process.cwd(), 'public/videos/barber-lessons');
const FALLBACK_BROLL = path.join(OUT_DIR, 'barber-lesson-1.mp4');
const SIDECAR_DIR = path.join(process.cwd(), 'scripts/course-builder/seeds/content');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const MISSING_ONLY = process.argv.includes('--missing');
const SLUG_FILTER = (() => {
  const i = process.argv.indexOf('--slug');
  return i !== -1 ? process.argv[i + 1] : null;
})();
const MODULE_FILTER = (() => {
  const i = process.argv.indexOf('--module');
  return i !== -1 ? parseInt(process.argv[i + 1]) : null;
})();
const CHAPTER_MODE = process.argv.includes('--chapter'); // concat all lessons into one file

let sb: SupabaseClient;
let openaiKey = '';

function initSupabase(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url?.startsWith('http') || !key) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (valid HTTP URL).',
    );
  }
  sb = createClient(url, key);
}

function resolveOpenAiKey(): string {
  if (fs.existsSync(SESSION_KEY_FILE)) {
    const fromFile = fs.readFileSync(SESSION_KEY_FILE, 'utf8').trim();
    if (fromFile.startsWith('sk-')) {
      process.env.OPENAI_API_KEY = fromFile;
      return fromFile;
    }
  }
  const fromEnv = process.env.OPENAI_API_KEY?.trim();
  if (fromEnv?.startsWith('sk-')) return fromEnv;
  throw new Error(
    'OPENAI_API_KEY required (export in shell or write sk- key to /tmp/.openai-session-key).',
  );
}

function resolveClipPath(candidate: string): string {
  if (fs.existsSync(candidate)) return candidate;
  if (fs.existsSync(FALLBACK_BROLL)) return FALLBACK_BROLL;
  throw new Error(`B-roll missing: ${candidate} (and no ${FALLBACK_BROLL})`);
}

// ─── Clip library — precise scene-matched b-roll ──────────────────────────────
const B = path.join(process.cwd(), 'public/videos/broll');
function clip(key: string) {
  return path.join(B, `${key}.mp4`);
}

// matchText runs the same keyword rules against any string (heading or body)
function matchText(t: string): string | null {
  if (/logging hours|clocking in|recording hours|timesheet|ojt hours/.test(t))
    return clip('logging-hours-timesheet');
  if (/dol apprenticeship|apprenticeship structure|apprentice/.test(t))
    return clip('apprentice-training');
  if (/2000.hour|1500.hour|licensure|license requirement/.test(t))
    return clip('barber-license-exam');
  if (/indiana.*law|ipla|license renewal|continuing education|scope of practice/.test(t))
    return clip('indiana-license-renewal');
  if (/state board exam|exam relevance|exam preparation|written exam/.test(t))
    return clip('state-board-exam-prep');
  if (/disinfecting clipper|clipper disinfect|clipper spray|contact time/.test(t))
    return clip('disinfecting-clippers');
  if (/disinfecting scissor|cleaning scissor/.test(t)) return clip('disinfecting-scissors');
  if (/washing hands|hand hygiene|handwash/.test(t)) return clip('washing-hands-barber');
  if (/cleaning station|reset.*station|station between|sanitizing.*station/.test(t))
    return clip('cleaning-barber-station');
  if (/neck strip|cape|draping/.test(t)) return clip('neck-strip-cape');
  if (/single.use|dispos.*item|sharps|porous item/.test(t)) return clip('disposing-single-use');
  if (/blood exposure|bloodborne|blood protocol/.test(t)) return clip('blood-exposure-protocol');
  if (/\bosha\b|hazcom|hazard communication/.test(t)) return clip('osha-barbershop');
  if (/\bppe\b|personal protective equipment/.test(t)) return clip('ppe-barber');
  if (/chemical handling|safe chemical|chemical procedure/.test(t))
    return clip('chemical-handling');
  if (/patch test/.test(t)) return clip('patch-test');
  if (/safety data sheet|\bsds\b/.test(t)) return clip('sds-safety-data-sheet');
  if (/\bsteriliz|\binfection control|pre.service clean|barbicide/.test(t))
    return clip('disinfecting-clippers');
  if (/ph scale|hair chemistry|chemical.*hair|hair.*chemical/.test(t)) return clip('ph-scale-hair');
  if (/relaxer|texturiz|permanent wave|chemical texture/.test(t)) return clip('relaxer-texturizer');
  if (/hair color|haircolor|\btint\b|\bbleach\b|highlight/.test(t))
    return clip('hair-color-chemical');
  if (/smart goal|goal setting|career goal/.test(t)) return clip('smart-goals-planning');
  if (/time management|scheduling|busy barbershop/.test(t)) return clip('time-management-barber');
  if (/\bethic|\bobligation\b|\bintegrity\b/.test(t)) return clip('ethics-professional');
  if (/professional image|personal hygiene|hygiene.*barber/.test(t))
    return clip('professional-appearance');
  if (/first impression/.test(t)) return clip('first-impression-barber');
  if (/client trust|client retention|loyal client/.test(t)) return clip('client-retention');
  if (/ergonomic|posture|standing.*barber/.test(t)) return clip('ergonomics-posture');
  if (/burnout|wellness|self.care|physical demand/.test(t)) return clip('burnout-wellness');
  if (/consultation|managing.*expectation|client.*expectation/.test(t))
    return clip('client-consultation');
  if (/complaint|client concern|conflict resolution/.test(t)) return clip('handling-complaints');
  if (/long.term.*client|client relationship|building.*client/.test(t))
    return clip('client-retention');
  if (/straight razor|\bshav|\bhot towel|\blather\b/.test(t)) return clip('barber-shaving');
  if (/\bbeard\b|mustache|facial hair/.test(t)) return clip('barber-beard-trim');
  if (/shampoo|scalp massage|scalp treatment|hair wash/.test(t)) return clip('barber-shampoo');
  if (/\bstyling\b|\bpomade\b|\bproduct application/.test(t)) return clip('barber-styling');
  if (/\blineup\b|\bedge up\b|hairline detail/.test(t)) return clip('barber-lineup');
  if (/\bfade\b|\btaper\b|\bblend\b/.test(t)) return clip('barber-cutting-hair');
  if (/\bscissor\b|\bshear\b|cutting technique/.test(t)) return clip('barber-cutting-hair');
  if (/\bclipper\b|\btrimmer\b|tool maintenance/.test(t)) return clip('barber-cutting-hair');
  if (/\bdisinfect|\bsanit/.test(t)) return clip('disinfecting-clippers');
  return null;
}

// pickClip — tries heading first, falls back to body text so generic headings
// like "Introduction" or "Key Takeaway" still get a content-matched clip.
function pickClip(heading: string, body: string, _lessonSlug: string): string {
  const h = heading.toLowerCase();
  const b = body.toLowerCase();
  const candidate = matchText(h) ?? matchText(b) ?? clip('barbershop-intro');
  return resolveClipPath(candidate);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileDur(f: string): number {
  return parseFloat(
    execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${f}"`, {
      encoding: 'utf8',
    }).trim(),
  );
}

function loadSidecar(slug: string): {
  content?: string;
  flashcards?: { term: string; definition: string }[];
} {
  const p = path.join(SIDECAR_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

// ─── Content splitting ────────────────────────────────────────────────────────

function splitIntoScenes(
  title: string,
  moduleName: string,
  content: string,
  flashcards?: { term: string; definition: string }[],
): { heading: string; body: string }[] {
  const scenes: { heading: string; body: string }[] = [];

  scenes.push({
    heading: 'Introduction',
    body: `Welcome to ${moduleName}. Today's lesson is ${title}. Let's get started.`,
  });

  const lines = content.split('\n');
  let currentHeading = '';
  let currentBody: string[] = [];

  const flush = () => {
    if (currentBody.length === 0) return;
    const body = currentBody
      .join(' ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    if (body.split(/\s+/).length > 10)
      scenes.push({ heading: currentHeading || 'Key Concepts', body });
    currentBody = [];
  };

  for (const line of lines) {
    const hMatch = line.match(/^#{1,3}\s+(.+)/);
    if (hMatch) {
      flush();
      currentHeading = hMatch[1].replace(/\*\*/g, '').trim();
    } else {
      const cleaned = line
        .replace(/^\s*[-*+]\s+/, '')
        .replace(/^\s*\d+\.\s+/, '')
        .trim();
      if (cleaned) currentBody.push(cleaned);
    }
  }
  flush();

  if (flashcards && flashcards.length > 0) {
    const terms = flashcards
      .slice(0, 5)
      .map((f) => `${f.term}: ${f.definition}`)
      .join('. ');
    scenes.push({
      heading: 'Key Terms Review',
      body: `Let's review some key terms from this lesson. ${terms}.`,
    });
  }

  scenes.push({
    heading: 'Summary',
    body: `That covers everything for ${title}. Complete the quiz and flashcard review before moving on. Great work today.`,
  });

  // Merge scenes under 25 words into the previous
  const merged: { heading: string; body: string }[] = [];
  for (const s of scenes) {
    if (s.body.split(/\s+/).length < 25 && merged.length > 0) {
      merged[merged.length - 1].body += ' ' + s.body;
    } else {
      merged.push({ ...s });
    }
  }

  return merged;
}

// ─── TTS ──────────────────────────────────────────────────────────────────────

async function generateTTS(text: string, outPath: string): Promise<void> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      input: text,
      voice: 'onyx',
      instructions: `You are Brandon Williams, a master barber with 12 years of experience teaching at a DOL-registered barbering apprenticeship program in Indiana.
Speak directly to your apprentices — confident, clear, and practical.
Steady professional pace. Emphasize key terms when you say them.
Natural pauses between paragraphs. Sound like you are in the shop teaching, not reading from a textbook.`,
      response_format: 'mp3',
      speed: 1.0,
    }),
  });
  if (!res.ok) throw new Error(`TTS failed (${res.status}): ${await res.text()}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

// ─── Video assembly ───────────────────────────────────────────────────────────

// Track how far into each clip we've consumed so consecutive scenes using the
// same clip always start where the previous one left off — no repeated footage.
const clipOffsets = new Map<string, number>();

// Build one scene: cut source clip from current offset to audio duration.
// Source clips are 79-190s. Each scene advances the offset so footage never repeats.
function buildScene(clipPath: string, audioPath: string, outPath: string): void {
  const audioDur = getFileDur(audioPath);
  const clipDur = getFileDur(clipPath);
  const offset = clipOffsets.get(clipPath) ?? 0;

  // If remaining clip isn't long enough, wrap back to start
  const startAt = offset + audioDur <= clipDur ? offset : 0;

  execSync(
    `ffmpeg -y -ss ${startAt.toFixed(3)} -i "${clipPath}" -i "${audioPath}" ` +
      `-map 0:v -map 1:a ` +
      `-t ${audioDur.toFixed(3)} ` +
      `-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24" ` +
      `-c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k ` +
      `-movflags +faststart "${outPath}"`,
    { stdio: 'pipe', maxBuffer: 200 * 1024 * 1024 },
  );

  // Advance offset for next scene using this clip
  clipOffsets.set(clipPath, startAt + audioDur);
}

// Concat all scene files → final output with +faststart.
// All scenes are encoded identically so stream copy is clean and seamless.
function concatScenes(scenePaths: string[], outPath: string, tmpDir: string): void {
  const listFile = path.join(tmpDir, 'scenes.txt');
  fs.writeFileSync(listFile, scenePaths.map((p) => `file '${p}'`).join('\n'));
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy -movflags +faststart "${outPath}"`,
    { stdio: 'pipe', maxBuffer: 500 * 1024 * 1024 },
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  initSupabase();
  openaiKey = resolveOpenAiKey();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { data: lessons, error } = await sb
    .from('course_lessons')
    .select('id, title, slug, order_index, content')
    .eq('course_id', COURSE_ID)
    .order('order_index');

  if (error) {
    console.error('DB error:', error.message);
    process.exit(1);
  }

  let targets = lessons!;
  if (SLUG_FILTER) targets = targets.filter((l) => l.slug === SLUG_FILTER);
  if (MODULE_FILTER)
    targets = targets.filter((l) => Math.floor((l as any).order_index / 1000) === MODULE_FILTER);
  if (MISSING_ONLY && !SLUG_FILTER) {
    targets = targets.filter((l) => {
      const outPath = path.join(OUT_DIR, `${(l as { slug: string }).slug}.mp4`);
      if (!fs.existsSync(outPath)) return true;
      try {
        return getFileDur(outPath) <= 60;
      } catch {
        return true;
      }
    });
  }
  if (targets.length === 0) {
    console.error('No lessons found');
    process.exit(1);
  }

  const MODULE_NAMES: Record<number, string> = {
    1: 'Module 1: Infection Control and Safety',
    2: 'Module 2: Hair Science and Scalp Analysis',
    3: 'Module 3: Haircutting Fundamentals',
    4: 'Module 4: Haircutting Techniques',
    5: 'Module 5: Shaving and Beard Services',
    6: 'Module 6: Chemical Services',
    7: 'Module 7: Professional and Business Skills',
    8: 'Module 8: State Board Exam Preparation',
  };

  console.log(`\n═══ Barber Video Generator — ${targets.length} lesson(s) ═══\n`);

  let ok = 0,
    skipped = 0,
    failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const lesson = targets[i] as any;
    const modNum = Math.floor(lesson.order_index / 1000);
    const moduleName = MODULE_NAMES[modNum] ?? 'Barber Apprenticeship';
    const outPath = path.join(OUT_DIR, `${lesson.slug}.mp4`);
    const prefix = `[${i + 1}/${targets.length}] ${lesson.slug}`;

    if (!FORCE && fs.existsSync(outPath)) {
      const dur = getFileDur(outPath);
      if (dur > 60) {
        console.log(`  SKIP  ${prefix} — ${Math.round(dur)}s`);
        skipped++;
        continue;
      }
      console.log(`  REGEN ${prefix} — only ${Math.round(dur)}s`);
    }

    const sidecar = loadSidecar(lesson.slug);
    const rawContent = lesson.content || sidecar.content || '';
    if (!rawContent) {
      console.log(`  ❌    ${prefix} — no content`);
      failed++;
      continue;
    }

    const scenes = splitIntoScenes(lesson.title, moduleName, rawContent, sidecar.flashcards);

    if (DRY_RUN) {
      const totalWords = scenes.reduce((n, s) => n + s.body.split(/\s+/).length, 0);
      console.log(
        `  DRY   ${prefix} — ${scenes.length} scenes ~${Math.round((totalWords / 150) * 60)}s`,
      );
      scenes.forEach((s, si) => {
        const clip = pickClip(s.heading, s.body, lesson.slug);
        const clipName = path.basename(clip, '.mp4');
        console.log(`         ${si + 1}. "${s.heading}" → ${clipName}`);
      });
      continue;
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `barber-${lesson.slug}-`));

    try {
      console.log(`\n  GEN   ${prefix} — ${scenes.length} scenes`);
      const scenePaths: string[] = [];

      for (let si = 0; si < scenes.length; si++) {
        const scene = scenes[si];
        const clip = pickClip(scene.heading, scene.body, lesson.slug);
        const clipName = path.basename(clip, '.mp4');
        const audioPath = path.join(tmpDir, `s${si}.mp3`);
        const scenePath = path.join(tmpDir, `s${si}.mp4`);
        const words = scene.body.split(/\s+/).length;

        process.stdout.write(
          `        scene ${si + 1}/${scenes.length} [${clipName}] "${scene.heading}" (${words}w)...`,
        );

        await generateTTS(scene.body, audioPath);
        const dur = getFileDur(audioPath);
        buildScene(clip, audioPath, scenePath);
        process.stdout.write(` ${Math.round(dur)}s ✓\n`);

        scenePaths.push(scenePath);
        try {
          fs.unlinkSync(audioPath);
        } catch {}
      }

      if (scenePaths.length === 0) throw new Error('No scenes built');

      process.stdout.write(`        concat ${scenePaths.length} scenes...`);
      concatScenes(scenePaths, outPath, tmpDir);
      const finalDur = getFileDur(outPath);
      process.stdout.write(` ${Math.round(finalDur)}s ✅\n`);

      try {
        fs.rmSync(tmpDir, { recursive: true });
      } catch {}

      const videoUrl = `/videos/barber-lessons/${lesson.slug}.mp4`;
      const { error: upErr } = await sb
        .from('course_lessons')
        .update({ video_url: videoUrl })
        .eq('id', lesson.id);
      if (upErr) process.stdout.write(`        ⚠️  DB: ${upErr.message}\n`);
      else process.stdout.write(`        DB ✅ ${videoUrl}\n`);

      ok++;
    } catch (err: any) {
      console.error(`  ❌    ${prefix} — ${err.message}`);
      try {
        fs.unlinkSync(outPath);
      } catch {}
      try {
        fs.rmSync(tmpDir, { recursive: true });
      } catch {}
      failed++;
    }
  }

  console.log(`\n═══ Done: ${ok} generated, ${skipped} skipped, ${failed} failed ═══\n`);

  // Chapter mode: concat all lesson videos into one continuous chapter file
  if (CHAPTER_MODE && MODULE_FILTER) {
    const chapterPath = path.join(OUT_DIR, `module-${MODULE_FILTER}-chapter.mp4`);
    const lessonFiles = targets
      .map((l) => path.join(OUT_DIR, `${(l as any).slug}.mp4`))
      .filter((f) => fs.existsSync(f));

    if (lessonFiles.length > 0) {
      console.log(
        `Building chapter: ${lessonFiles.length} lessons → ${path.basename(chapterPath)}`,
      );
      const tmpList = path.join(os.tmpdir(), `chapter-${MODULE_FILTER}.txt`);
      fs.writeFileSync(tmpList, lessonFiles.map((f) => `file '${f}'`).join('\n'));
      const raw = path.join(os.tmpdir(), `chapter-${MODULE_FILTER}-raw.mp4`);
      execSync(`ffmpeg -y -f concat -safe 0 -i "${tmpList}" -c copy "${raw}"`, {
        stdio: 'pipe',
        maxBuffer: 2000 * 1024 * 1024,
      });
      execSync(`ffmpeg -y -i "${raw}" -c copy -movflags +faststart "${chapterPath}"`, {
        stdio: 'pipe',
        maxBuffer: 2000 * 1024 * 1024,
      });
      try {
        fs.unlinkSync(raw);
        fs.unlinkSync(tmpList);
      } catch {}
      const dur = getFileDur(chapterPath);
      console.log(
        `Chapter ready: ${Math.round(dur / 60)}min ${Math.round(dur % 60)}s → ${chapterPath}`,
      );
    }
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
