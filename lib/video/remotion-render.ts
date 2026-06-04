/**
 * lib/video/remotion-render.ts
 *
 * Free video generation pipeline:
 *   1. edge-tts  → MP3 narration (no API key)
 *   2. Pexels    → background image (free key) or Pollinations.ai (zero-key)
 *   3. Remotion  → render MP4 from React composition
 *
 * This is the zero-cost fallback when Synthesia / D-ID / Sora are unavailable.
 */

import path from 'path';
import os from 'os';
import { mkdir, readFile, rm, writeFile, unlink } from 'fs/promises';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { registerUsageEvent } from '@remotion/licensing';
import { generateEdgeTTS, buildLessonScript, EDGE_TTS_VOICES, type EdgeTTSVoice } from './edge-tts';
import { getPexelsImage } from './pexels';
import { logger } from '@/lib/logger';
// Type-only import — never bundled, only used for type checking
import type { ElevateLessonProps } from '@/remotion-src/compositions/ElevateLesson';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  lessonRenderTempPaths,
  uploadLessonFileFromDisk,
  uploadLessonMediaBuffer,
} from './upload-lesson-media';

// Remotion's inputProps requires Record<string, unknown> — this cast is safe
// because ElevateLessonProps is a plain serialisable object.
type RemotionProps = ElevateLessonProps & Record<string, unknown>;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RemotionLessonInput {
  lessonId: string;
  title: string;
  moduleTitle: string;
  objective: string;
  keyPoints: string[]; // 3–5 bullet points
  example: string;
  summary: string;
  quizTeaser?: string;
  domainKey?: string; // for Pexels topic lookup (e.g. 'hvac', 'foundations')
  instructorId?: string; // maps to voice + name
  courseName?: string;
}

export interface RemotionRenderResult {
  success: boolean;
  videoUrl?: string; // Supabase course-videos public URL
  audioUrl?: string; // Supabase course-videos public URL (MP3)
  duration?: number; // seconds
  method: 'remotion-free';
  error?: string;
}

// ── Instructor config ─────────────────────────────────────────────────────────

interface InstructorConfig {
  name: string;
  title: string;
  voice: EdgeTTSVoice;
  imageSrc?: string;
  topBarColor: string;
  accentColor: string;
}

const INSTRUCTOR_CONFIGS: Record<string, InstructorConfig> = {
  'marcus-johnson': {
    name: 'Marcus Johnson',
    title: 'Workforce Development Specialist',
    voice: EDGE_TTS_VOICES.marcus,
    imageSrc: '/images/instructors/marcus-johnson.jpg',
    topBarColor: '#f97316',
    accentColor: '#3b82f6',
  },
  'dr-sarah-chen': {
    name: 'Dr. Sarah Chen',
    title: 'Healthcare Training Specialist',
    voice: EDGE_TTS_VOICES.female,
    imageSrc: '/images/instructors/sarah-chen.jpg',
    topBarColor: '#10b981',
    accentColor: '#6366f1',
  },
  'james-williams': {
    name: 'James Williams',
    title: 'Master Barber & Instructor',
    voice: EDGE_TTS_VOICES.warm,
    imageSrc: '/images/instructors/james-williams.jpg',
    topBarColor: '#8b5cf6',
    accentColor: '#f59e0b',
  },
  'lisa-martinez': {
    name: 'Lisa Martinez',
    title: 'IT & Cybersecurity Instructor',
    voice: EDGE_TTS_VOICES.female,
    imageSrc: '/images/instructors/lisa-martinez.jpg',
    topBarColor: '#06b6d4',
    accentColor: '#8b5cf6',
  },
  'robert-davis': {
    name: 'Robert Davis',
    title: 'CDL & Transportation Instructor',
    voice: EDGE_TTS_VOICES.british,
    imageSrc: '/images/instructors/robert-davis.jpg',
    topBarColor: '#ef4444',
    accentColor: '#f97316',
  },
  'angela-thompson': {
    name: 'Angela Thompson',
    title: 'Business & Career Coach',
    voice: EDGE_TTS_VOICES.neutral,
    imageSrc: '/images/instructors/angela-thompson.jpg',
    topBarColor: '#ec4899',
    accentColor: '#14b8a6',
  },
};

const DEFAULT_INSTRUCTOR: InstructorConfig = INSTRUCTOR_CONFIGS['marcus-johnson'];

function getInstructor(instructorId?: string): InstructorConfig {
  if (instructorId && INSTRUCTOR_CONFIGS[instructorId]) {
    return INSTRUCTOR_CONFIGS[instructorId];
  }
  return DEFAULT_INSTRUCTOR;
}

// ── Segment frame calculator ──────────────────────────────────────────────────

/**
 * Estimate segment durations from audio length.
 * Splits proportionally: intro 15%, concept 25%, visual 25%, application 20%, wrapup 15%.
 */
function calcSegmentFrames(
  totalSeconds: number,
  fps = 30,
): [number, number, number, number, number] {
  const total = Math.round(totalSeconds * fps);
  const ratios = [0.15, 0.25, 0.25, 0.2, 0.15];
  const frames = ratios.map((r) => Math.round(total * r)) as [
    number,
    number,
    number,
    number,
    number,
  ];

  // Adjust last segment to absorb rounding error
  const sum = frames.reduce((a, b) => a + b, 0);
  frames[4] += total - sum;

  return frames;
}

// ── Estimate audio duration from word count ───────────────────────────────────

function estimateDuration(script: string): number {
  // Edge TTS at -5% rate ≈ 140 words/min
  const words = script.split(/\s+/).length;
  return Math.ceil((words / 140) * 60);
}

// ── Remotion bundle cache ─────────────────────────────────────────────────────

let _bundleUrl: string | null = null;

async function getBundleUrl(): Promise<string> {
  if (_bundleUrl) return _bundleUrl;

  logger.info('[RemotionRender] Bundling Remotion composition...');
  const entryPoint = path.join(process.cwd(), 'remotion-src', 'index.ts');

  _bundleUrl = await bundle({
    entryPoint,
    // Webpack override: mark Node-only modules as external so they don't
    // get bundled into the browser-side Remotion bundle.
    webpackOverride: (config) => ({
      ...config,
      externals: [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'edge-tts',
      ],
    }),
  });

  logger.info('[RemotionRender] Bundle ready');
  return _bundleUrl;
}

// ── Main render function ──────────────────────────────────────────────────────

/**
 * Render a lesson MP4 using the free pipeline:
 *   edge-tts → Pexels/Pollinations → Remotion
 *
 * Renders to a temp dir, uploads MP4 (+ MP3) to Supabase course-videos, then deletes temp files.
 */
export async function renderLessonVideo(input: RemotionLessonInput): Promise<RemotionRenderResult> {
  const { lessonId, domainKey = 'default', instructorId } = input;
  const instructor = getInstructor(instructorId);
  const paths = lessonRenderTempPaths(lessonId);

  try {
    await mkdir(paths.dir, { recursive: true });

    // ── Step 1: Generate narration audio via edge-tts ─────────────────────────
    logger.info(`[RemotionRender] Generating TTS for lesson ${lessonId}`);

    const script = buildLessonScript({
      title: input.title,
      moduleTitle: input.moduleTitle,
      objective: input.objective,
      keyPoints: input.keyPoints,
      example: input.example,
      summary: input.summary,
    });

    const audioBuffer = await generateEdgeTTS(script, { voice: instructor.voice });
    await writeFile(paths.audioPath, audioBuffer);

    const duration = estimateDuration(script);
    logger.info(`[RemotionRender] Audio written: ${paths.audioPath} (~${duration}s)`);

    // ── Step 2: Fetch background image ────────────────────────────────────────
    logger.info(`[RemotionRender] Fetching background image (domain: ${domainKey})`);
    const backgroundImageSrc = (await getPexelsImage(domainKey)) ?? undefined;

    // ── Step 3: Build Remotion props ──────────────────────────────────────────
    const segmentFrames = calcSegmentFrames(duration);
    const totalFrames = segmentFrames.reduce((a, b) => a + b, 0);

    const compositionProps: RemotionProps = {
      title: input.title,
      moduleTitle: input.moduleTitle,
      objective: input.objective,
      keyPoints: input.keyPoints,
      example: input.example,
      summary: input.summary,
      quizTeaser: input.quizTeaser,
      audioSrc: paths.audioPath, // absolute path — Remotion reads from disk
      backgroundImageSrc,
      instructorName: instructor.name,
      instructorTitle: instructor.title,
      instructorImageSrc: instructor.imageSrc,
      topBarColor: instructor.topBarColor,
      accentColor: instructor.accentColor,
      backgroundColor: '#0f172a',
      segmentFrames,
    };

    // ── Step 4: Bundle and render ─────────────────────────────────────────────
    logger.info(`[RemotionRender] Rendering MP4 (${totalFrames} frames @ 30fps = ${duration}s)`);

    const bundleUrl = await getBundleUrl();

    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: 'ElevateLesson',
      inputProps: compositionProps,
    });

    // Remotion free license — ${PLATFORM_DEFAULTS.orgName} is a registered 501(c)(3)
    // nonprofit. Free tier requires no license key (licenseKey: null).
    // See LICENSES.md for compliance documentation.
    await registerUsageEvent({
      event: 'cloud-render',
      licenseKey: null,
      host: null,
      succeeded: true,
      isProduction: process.env.NODE_ENV === 'production',
    }).catch(() => {
      // Non-fatal — usage tracking failure must not block video generation
    });

    await renderMedia({
      composition,
      serveUrl: bundleUrl,
      codec: 'h264',
      outputLocation: paths.videoPath,
      inputProps: compositionProps,
      // Use all available CPU cores for encoding
      concurrency: Math.max(1, (os.cpus().length ?? 2) - 1),
      // Reasonable quality for LMS delivery
      crf: 23,
      // Log progress every 10%
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct % 10 === 0) {
          logger.info(`[RemotionRender] ${pct}% — lesson ${lessonId}`);
        }
      },
    });

    logger.info(`[RemotionRender] MP4 written: ${paths.videoPath}`);

    const audioUrl = await uploadLessonMediaBuffer(await readFile(paths.audioPath), lessonId, 'mp3');
    const videoUrl = await uploadLessonFileFromDisk(paths.videoPath, lessonId, 'mp4');
    await rm(paths.dir, { recursive: true, force: true }).catch(() => {});

    return {
      success: true,
      videoUrl,
      audioUrl,
      duration,
      method: 'remotion-free',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[RemotionRender] Render failed: ' + msg);

    await unlink(paths.videoPath).catch(() => {});
    await rm(paths.dir, { recursive: true, force: true }).catch(() => {});

    return {
      success: false,
      error: msg,
      method: 'remotion-free',
    };
  }
}

// ── Batch render ──────────────────────────────────────────────────────────────

export interface BatchRenderResult {
  lessonId: string;
  title: string;
  result: RemotionRenderResult;
}

/**
 * Render multiple lessons sequentially.
 * Sequential (not parallel) to avoid OOM on the Remotion renderer.
 */
export async function renderLessonVideoBatch(
  lessons: RemotionLessonInput[],
  onProgress?: (done: number, total: number, current: RemotionLessonInput) => void,
): Promise<BatchRenderResult[]> {
  const results: BatchRenderResult[] = [];

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    onProgress?.(i, lessons.length, lesson);

    const result = await renderLessonVideo(lesson);
    results.push({ lessonId: lesson.lessonId, title: lesson.title, result });

    // Brief pause between renders to let GC run
    if (i < lessons.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  onProgress?.(lessons.length, lessons.length, lessons[lessons.length - 1]);
  return results;
}

// ── Domain key inference ──────────────────────────────────────────────────────

/**
 * Infer a Pexels domain key from course name or lesson title.
 * Used when the caller doesn't provide an explicit domainKey.
 */
export function inferDomainKey(courseName: string, lessonTitle = ''): string {
  const text = `${courseName} ${lessonTitle}`.toLowerCase();

  if (text.match(/hvac|refriger|air.?condition|heat|cool/)) return 'hvac';
  if (text.match(/electric|wiring|circuit/)) return 'electrical';
  if (text.match(/barber|cosmetol|hair|groom/)) return 'barber';
  if (text.match(/ethic|moral|professional/)) return 'ethics';
  if (text.match(/advocac|rights|policy/)) return 'advocacy';
  if (text.match(/cultur|divers|equity|inclusion/)) return 'cultural_competency';
  if (text.match(/document|record|report|note/)) return 'documentation';
  if (text.match(/career|job|employ|resume|interview/)) return 'career_readiness';
  if (text.match(/found|intro|overview|basic|principle/)) return 'foundations';

  return 'default';
}
