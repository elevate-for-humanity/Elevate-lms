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

import 'server-only';

import path from 'path';
import os from 'os';
import { mkdir, writeFile, unlink, rm } from 'fs/promises';
import { generateEdgeTTS, buildLessonScript, EDGE_TTS_VOICES, type EdgeTTSVoice } from './edge-tts';
import { getPexelsImage, getPexelsVideoClip } from './pexels';
import { logger } from '@/lib/logger';
// Type-only import — never bundled, only used for type checking
import type { ElevateLessonProps } from '@/remotion-src/compositions/ElevateLesson';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  lessonRenderTempPaths,
  uploadCourseVideosObject,
  uploadLessonFileFromDisk,
  uploadLessonMediaBuffer,
} from '@/lib/video/upload-lesson-media';
import { scenePrompt, type MediaStoryboard } from './media-director';
import {
  deleteGpuVideoAsset,
  downloadGpuVideoAsset,
  generateGpuVideo,
  gpuVideoAvailable,
} from './gpu-video-client';
import type { SceneData, SlideLessonProps } from '@/remotion-src/compositions/SlideLesson';
import { instructionalLayoutForScene } from '@/remotion-src/instructional-layout';
import { deriveInstructionalVisualIntent } from '@/server/video-generator/visual-intelligence';

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
  visualPrompt?: string;
}

export interface RemotionRenderResult {
  success: boolean;
  videoUrl?: string; // public path, e.g. /generated/lessons/lesson-<id>.mp4
  audioUrl?: string; // public path to the MP3 (kept for reuse)
  duration?: number; // seconds
  method: 'remotion-free';
  error?: string;
  sceneData?: MediaStoryboard;
}

export interface StoryboardRenderInput {
  lessonId: string;
  courseTitle: string;
  storyboard: MediaStoryboard;
  instructorId?: string;
}

function vttTimestamp(seconds: number): string {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':') + `.${String(millis).padStart(3, '0')}`;
}

export function buildStoryboardWebVtt(scenes: SceneData[]): string {
  let cursor = 1;
  const cues = scenes.map((scene, index) => {
    const start = cursor;
    cursor += scene.durationFrames / 30;
    return `${index + 1}\n${vttTimestamp(start)} --> ${vttTimestamp(cursor)}\n${scene.narration}`;
  });
  return `WEBVTT\n\n${cues.join('\n\n')}\n`;
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
  'avery-brooks': {
    name: 'Avery Brooks',
    title: 'Cosmetology Education Specialist',
    voice: EDGE_TTS_VOICES.female,
    topBarColor: '#a855f7',
    accentColor: '#ec4899',
  },
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

// One real portrait is packaged with every Admin image and served by the Remotion bundle.
// Keep rendering deterministic even when optional instructor-specific portraits are absent.
const CANONICAL_PACKAGED_INSTRUCTOR_IMAGE = '/images/instructors/marcus-johnson.jpg';
const CANONICAL_TALKING_INSTRUCTOR_IMAGE =
  'https://www.elevateforhumanity.org/images/brandon-instructor.png';

function requiredInstructor(id: string): InstructorConfig {
  const instructor = INSTRUCTOR_CONFIGS[id];
  if (!instructor) throw new Error(`REMOTION_INSTRUCTOR_MISSING:${id}`);
  return instructor;
}

const DEFAULT_INSTRUCTOR = requiredInstructor('marcus-johnson');

function getInstructor(instructorId?: string): InstructorConfig {
  if (!instructorId) return DEFAULT_INSTRUCTOR;
  return requiredInstructor(instructorId);
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

// ── Output paths ──────────────────────────────────────────────────────────────

function getOutputPaths(lessonId: string) {
  const temp = lessonRenderTempPaths(lessonId);
  const outputDir = temp.dir;
  return {
    outputDir,
    audioPath: temp.audioPath,
    videoPath: temp.videoPath,
  };
}

// ── Remotion bundle cache ─────────────────────────────────────────────────────

let _bundleUrl: string | null = null;

async function getBundleUrl(): Promise<string> {
  if (_bundleUrl) return _bundleUrl;

  logger.info('[RemotionRender] Bundling Remotion composition...');
  const entryPoint = path.join(process.cwd(), 'remotion-src', 'index.ts');

  // Dynamic import — keeps Remotion out of the Next.js webpack bundle
  const { bundle } = await import('@remotion/bundler');
  _bundleUrl = await bundle({
    entryPoint,
    // Explicitly package static assets. The Admin server runs from apps/admin,
    // while canonical instructor media lives in that runtime public directory.
    publicDir: path.join(process.cwd(), 'public'),
    // Webpack override: mark Node-only modules as external so they don't
    // get bundled into the browser-side Remotion bundle.
    webpackOverride: (config) => ({
      ...config,
      externals: [...(Array.isArray(config.externals) ? config.externals : []), 'edge-tts'],
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
 * Output is written to public/generated/lessons/lesson-<id>.mp4
 * Returns the public URL path.
 */
export async function renderLessonVideo(input: RemotionLessonInput): Promise<RemotionRenderResult> {
  const { lessonId, domainKey = 'default', instructorId } = input;
  const instructor = getInstructor(instructorId);
  const paths = getOutputPaths(lessonId);

  try {
    await mkdir(paths.outputDir, { recursive: true });

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

    // Remotion compositions execute in Chromium, so they cannot read an
    // arbitrary host filesystem path. Persist narration before rendering and
    // pass its public URL to the browser-side <Audio> component.
    const audioUrl = await uploadLessonFileFromDisk(paths.audioPath, lessonId, 'mp3');

    const duration = estimateDuration(script);
    logger.info(`[RemotionRender] Audio written: ${paths.audioPath} (~${duration}s)`);

    // ── Step 2: Fetch background image ────────────────────────────────────────
    logger.info(`[RemotionRender] Fetching background image (domain: ${domainKey})`);
    const imageQuery = input.visualPrompt?.replace(/[^a-zA-Z0-9 ,'-]/g, ' ').slice(0, 180);
    const backgroundImageSrc = await getPexelsImage(domainKey, imageQuery ? { query: imageQuery } : {});

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
      ...(input.quizTeaser ? { quizTeaser: input.quizTeaser } : {}),
      audioSrc: audioUrl, // browser-readable durable narration asset
      ...(backgroundImageSrc ? { backgroundImageSrc } : {}),
      instructorName: instructor.name,
      instructorTitle: instructor.title,
      instructorImageSrc: CANONICAL_PACKAGED_INSTRUCTOR_IMAGE,
      topBarColor: instructor.topBarColor,
      accentColor: instructor.accentColor,
      backgroundColor: '#fff7ed',
      segmentFrames,
    };

    // ── Step 4: Bundle and render ─────────────────────────────────────────────
    logger.info(`[RemotionRender] Rendering MP4 (${totalFrames} frames @ 30fps = ${duration}s)`);

    const bundleUrl = await getBundleUrl();

    // Dynamic imports — keep Remotion renderer out of Next.js webpack bundle
    const { renderMedia, selectComposition } = await import('@remotion/renderer');
    const { registerUsageEvent } = await import('@remotion/licensing');

    const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE?.trim() || undefined;
    const composition = await selectComposition({
      serveUrl: bundleUrl,
      ...(browserExecutable ? { browserExecutable } : {}),
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
      ...(browserExecutable ? { browserExecutable } : {}),
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

    const videoUrl = await uploadLessonFileFromDisk(paths.videoPath, lessonId, 'mp4');
    await rm(paths.outputDir, { recursive: true, force: true }).catch(() => {});

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

    // Clean up partial output
    await unlink(paths.videoPath).catch(() => {});
    await unlink(paths.audioPath).catch(() => {});
    await rm(paths.outputDir, { recursive: true, force: true }).catch(() => {});

    return {
      success: false,
      error: msg,
      method: 'remotion-free',
    };
  }
}

/** Render the canonical Media Director storyboard through the existing rich
 * SlideLesson composition. Each scene gets its own narration and relevant
 * full-frame motion or image fallback instead of collapsing to one backdrop. */
export async function renderStoryboardVideo(input: StoryboardRenderInput): Promise<RemotionRenderResult> {
  const paths = getOutputPaths(input.lessonId);
  const instructor = getInstructor(input.instructorId);
  try {
    await mkdir(paths.outputDir, { recursive: true });
    const scenes: SceneData[] = [];
    // GPU instructional scenes flow through
    // the compositor, captions/transcript generation, compression, and the
    // canonical quality gate.
    const canGenerateMotion = await gpuVideoAvailable();
    const resolvedStoryboard: MediaStoryboard = structuredClone(input.storyboard);

    for (const [index, scene] of input.storyboard.scenes.entries()) {
      const narration = scene.dialogue?.trim() || scene.action.trim();
      const audio = await generateEdgeTTS(narration, { voice: instructor.voice });
      const audioSrc = await uploadLessonMediaBuffer(audio, `${input.lessonId}-scene-${index + 1}`, 'mp3');
      const visualIntent = deriveInstructionalVisualIntent({
        domainKey: /hvac|epa 608|refriger/i.test(input.courseTitle) ? 'hvac_epa608' : null,
        title: scene.subject,
        action: scene.action,
        visualFocus: scene.requiredVisualEvidence,
        sceneType: scene.sceneType,
      });
      const query = visualIntent.query;
      const instructionalLayout = visualIntent.deterministicDiagram
        ? instructionalLayoutForScene({ title: scene.subject, action: scene.action, sceneType: scene.sceneType })
        : null;
      let clipUrl = instructionalLayout ? null : scene.sourceVideoUrl || null;
      let lipSyncedInstructor = false;

      // A visible instructor may appear only when the delivered narration is
      // actually driving the mouth movement. Keep this to the opening scene so
      // the rest of the lesson can teach with cinematic and exact graphics.
      if (index === 0 && process.env.DID_API_KEY?.trim()) {
        try {
          const { createTalk, pollTalkResult } = await import('@/lib/d-id/generate-talk');
          const talk = await createTalk({
            photoUrl: CANONICAL_TALKING_INSTRUCTOR_IMAGE,
            audioUrl: audioSrc,
            expression: 'subtle',
          });
          const completed = await pollTalkResult(talk.id);
          if (completed.result_url) {
            clipUrl = completed.result_url;
            lipSyncedInstructor = true;
            const currentScene = resolvedStoryboard.scenes[index];
            if (!currentScene) throw new Error(`MEDIA_SCENE_MISSING:${index}`);
            resolvedStoryboard.scenes[index] = {
              ...currentScene,
              sourceVideoUrl: clipUrl,
              referenceImageUrl: CANONICAL_TALKING_INSTRUCTOR_IMAGE,
              resolvedProvider: 'd-id',
              resolvedModel: 'talks-lip-sync',
            };
          }
        } catch (error) {
          logger.warn('[RemotionRender] Lip-synced instructor unavailable; using non-speaking cinematic footage', {
            lessonId: input.lessonId,
            scene: index + 1,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const imageUrl = lipSyncedInstructor
        ? CANONICAL_TALKING_INSTRUCTOR_IMAGE
        : instructionalLayout
          ? null
          : scene.referenceImageUrl || await getPexelsImage('default', { query });
      let generated: Awaited<ReturnType<typeof generateGpuVideo>> = null;
      if (!clipUrl && canGenerateMotion) {
        try {
          generated = await generateGpuVideo({
            prompt: scenePrompt(scene, input.storyboard.characters),
            operation: imageUrl ? 'imageToVideo' : 'textToVideo',
            ...(imageUrl ? { imageUrl } : {}),
            width: input.storyboard.width,
            height: input.storyboard.height,
            durationSeconds: Math.min(15, Math.max(4, scene.durationSeconds)),
            ...(scene.seed !== undefined ? { seed: scene.seed } : {}),
            ...(scene.negativePrompt ? { negativePrompt: scene.negativePrompt } : {}),
          });
          if (generated) {
            const buffer = await downloadGpuVideoAsset(generated);
            clipUrl = await uploadLessonMediaBuffer(
              buffer,
              `${input.lessonId}-scene-${index + 1}`,
              'mp4',
            );
            const currentScene = resolvedStoryboard.scenes[index];
            if (!currentScene) throw new Error(`MEDIA_SCENE_MISSING:${index}`);
            resolvedStoryboard.scenes[index] = {
              ...currentScene,
              operation: imageUrl ? 'imageToVideo' : 'textToVideo',
              ...(imageUrl ? { referenceImageUrl: imageUrl } : {}),
              sourceVideoUrl: clipUrl,
              resolvedProvider: generated.provider,
              resolvedModel: generated.provider === 'wan' ? 'Wan' : 'LTX-Video',
            };
          }
        } catch (error) {
          logger.warn('[RemotionRender] Generated scene unavailable; using licensed fallback', {
            lessonId: input.lessonId,
            scene: index + 1,
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          if (generated) await deleteGpuVideoAsset(generated);
        }
      }
      if (!clipUrl) {
        clipUrl = await getPexelsVideoClip(query, {
          minDuration: 3,
          maxDuration: 30,
          perPage: 8,
        });
      }
      const currentScene = resolvedStoryboard.scenes[index];
      if (!currentScene) throw new Error(`MEDIA_SCENE_MISSING:${index}`);
      const resolvedProvider = instructionalLayout
        ? 'remotion'
        : currentScene.resolvedProvider ||
          (clipUrl ? 'pexels' : imageUrl?.includes('pollinations') ? 'pollinations' : imageUrl ? 'pexels' : undefined);
      const resolvedModel = instructionalLayout
        ? `deterministic-${instructionalLayout.kind}`
        : currentScene.resolvedModel || (clipUrl ? 'stock-video' : imageUrl ? 'still-image' : undefined);
      resolvedStoryboard.scenes[index] = {
        ...currentScene,
        ...(imageUrl ? { referenceImageUrl: imageUrl } : {}),
        ...(clipUrl ? { sourceVideoUrl: clipUrl } : {}),
        ...(resolvedProvider ? { resolvedProvider } : {}),
        ...(resolvedModel ? { resolvedModel } : {}),
      };
      const narrationSeconds = Math.ceil((narration.split(/\s+/).length / 140) * 60) + 1;
      const durationSeconds = Math.max(scene.durationSeconds, narrationSeconds, 4);
      const bullets = narration
        .split(/(?<=[.!?])\s+/)
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 4);

      scenes.push({
        scene_number: index + 1,
        title: scene.subject,
        bullets: bullets.length ? bullets : [scene.action],
        narration,
        clip_keyword: query,
        clipUrl,
        imageUrl,
        audioSrc,
        durationFrames: Math.ceil(durationSeconds * 30),
        sceneType: scene.sceneType,
        memoryAnchor: scene.memoryAnchor,
      });
    }

    const props: SlideLessonProps & Record<string, unknown> = {
      courseTitle: input.courseTitle,
      lessonTitle: input.storyboard.title,
      scenes,
      primaryColor: instructor.topBarColor,
      accentColor: instructor.accentColor,
      backgroundColor: '#f8fafc',
      surfaceMode: 'bright',
      logoText: 'Elevate LMS',
    };
    const totalFrames = 90 + scenes.reduce((sum, scene) => sum + scene.durationFrames, 0);
    const bundleUrl = await getBundleUrl();
    const { renderMedia, selectComposition } = await import('@remotion/renderer');
    const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE?.trim() || undefined;
    const selected = await selectComposition({
      serveUrl: bundleUrl,
      ...(browserExecutable ? { browserExecutable } : {}),
      id: 'SlideLesson',
      inputProps: props,
    });
    const composition = { ...selected, durationInFrames: totalFrames };
    await renderMedia({
      composition,
      serveUrl: bundleUrl,
      ...(browserExecutable ? { browserExecutable } : {}),
      codec: 'h264',
      outputLocation: paths.videoPath,
      inputProps: props,
      concurrency: Math.max(1, (os.cpus().length ?? 2) - 1),
      crf: 20,
    });
    const captionUrl = await uploadCourseVideosObject(
      Buffer.from(buildStoryboardWebVtt(scenes), 'utf8'),
      `generated-lessons/lesson-${input.lessonId}.vtt`,
      'text/vtt',
    );
    const transcriptUrl = await uploadCourseVideosObject(
      Buffer.from(scenes.map((scene) => scene.narration).join('\n\n'), 'utf8'),
      `generated-lessons/lesson-${input.lessonId}.txt`,
      'text/plain',
    );
    resolvedStoryboard.captionUrl = captionUrl;
    resolvedStoryboard.transcriptUrl = transcriptUrl;
    const videoUrl = await uploadLessonFileFromDisk(paths.videoPath, input.lessonId, 'mp4');
    await rm(paths.outputDir, { recursive: true, force: true }).catch(() => {});
    return {
      success: true,
      videoUrl,
      duration: totalFrames / 30,
      method: 'remotion-free',
      sceneData: resolvedStoryboard,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[RemotionRender] Storyboard render failed: ' + message);
    await rm(paths.outputDir, { recursive: true, force: true }).catch(() => {});
    return { success: false, error: message, method: 'remotion-free' };
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

  for (const [i, lesson] of lessons.entries()) {
    onProgress?.(i, lessons.length, lesson);

    const result = await renderLessonVideo(lesson);
    results.push({ lessonId: lesson.lessonId, title: lesson.title, result });

    // Brief pause between renders to let GC run
    if (i < lessons.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const lastLesson = lessons.at(-1);
  if (lastLesson) onProgress?.(lessons.length, lessons.length, lastLesson);
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
  if (text.match(/business|entrepreneur|market|customer|finance|startup|esb/)) return 'business';
  if (text.match(/found|intro|overview|basic|principle/)) return 'foundations';

  return 'default';
}
