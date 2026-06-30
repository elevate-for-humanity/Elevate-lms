/**
 * POST /api/generate-video
 *
 * Renders a slide-based lesson MP4 using the free pipeline:
 *   1. Fetch lesson from course_lessons
 *   2. Split script into scenes (AI-assisted or rule-based)
 *   3. Fetch Pexels video clips per scene keyword
 *   4. Generate per-scene TTS audio via edge-tts
 *   5. Render MP4 with Remotion SlideLesson composition
 *   6. Upload MP4 to Supabase Storage (course-videos bucket)
 *   7. Update course_lessons.video_url + video_status = 'complete'
 *
 * Input:  { lesson_id: string }
 * Output: { video_url: string, duration_seconds: number, scene_count: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import { mkdir, writeFile, readFile, unlink, mkdtemp } from 'fs/promises';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { generateEdgeTTS, EDGE_TTS_VOICES } from '@/lib/video/edge-tts';
import { getPexelsVideoClip, getPexelsImage, getPollinationsImage } from '@/lib/video/pexels';
// Types only — dynamic import at render time to avoid Turbopack tracing remotion/
import type { SceneData, SlideLessonProps } from '@/remotion-src/compositions/SlideLesson';
async function calcSlideLessonFrames(scenes: Pick<SceneData, 'durationFrames'>[]) {
  const { calcSlideLessonFrames: fn } = await import('@/remotion-src/compositions/SlideLesson');
  return fn(scenes);
}

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 min — rendering takes time

// ── Scene builder ─────────────────────────────────────────────────────────────

interface RawScene {
  scene_number: number;
  title: string;
  bullets: string[];
  narration: string;
  clip_keyword: string;
}

/**
 * Split a lesson script into scenes.
 * Rule-based: one scene per paragraph block, max 5 scenes.
 * Wraps with a branded intro scene and a recap scene automatically.
 */
function buildScenesFromScript(lesson: {
  title: string;
  script: string;
  bullet_points: string[];
  duration_seconds?: number;
}): RawScene[] {
  const { title, script, bullet_points } = lesson;

  // Split on double newlines or sentence groups
  const paragraphs = script
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20)
    .slice(0, 4); // max 4 content scenes

  const scenes: RawScene[] = [];

  // Scene 1: intro / overview
  scenes.push({
    scene_number: 1,
    title,
    bullets: bullet_points.slice(0, 3),
    narration: paragraphs[0] ?? `In this lesson, we'll cover: ${title}.`,
    clip_keyword: deriveClipKeyword(title),
  });

  // Middle scenes from paragraphs
  paragraphs.slice(1).forEach((para, i) => {
    const sceneNum = i + 2;
    // Pull bullets relevant to this paragraph position
    const bulletSlice = bullet_points.slice(sceneNum - 1, sceneNum + 2);
    scenes.push({
      scene_number: sceneNum,
      title: extractHeading(para) ?? `Key Concept ${sceneNum}`,
      bullets: bulletSlice.length ? bulletSlice : [para.substring(0, 120)],
      narration: para,
      clip_keyword: deriveClipKeyword(para),
    });
  });

  // Final recap scene
  const recapNum = scenes.length + 1;
  scenes.push({
    scene_number: recapNum,
    title: 'Recap',
    bullets: bullet_points.slice(-3),
    narration: `Let's review what we covered in ${title}. Complete the knowledge check to continue.`,
    clip_keyword: 'learning education',
  });

  return scenes;
}

/** Extract a short heading from the first sentence of a paragraph. */
function extractHeading(para: string): string | null {
  const first = para.split(/[.!?]/)[0]?.trim();
  if (!first || first.length > 80) return null;
  return first;
}

/** Map lesson text to a Pexels search keyword. */
function deriveClipKeyword(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/hvac|refriger|air.?condition/)) return 'hvac technician';
  if (t.match(/ethic|moral|professional conduct/)) return 'professional meeting';
  if (t.match(/recover|sobriety|substance/)) return 'support group';
  if (t.match(/career|job|employ|resume/)) return 'career success';
  if (t.match(/health|medical|cna|nurse/)) return 'healthcare professional';
  if (t.match(/barber|cosmetol|hair/)) return 'barbershop';
  if (t.match(/electric|wiring|circuit/)) return 'electrical work';
  if (t.match(/document|record|report/)) return 'writing notes';
  if (t.match(/communit|people|group/)) return 'community people';
  return 'professional learning';
}

// ── Remotion bundle cache ─────────────────────────────────────────────────────

let _bundleUrl: string | null = null;

async function getBundleUrl(): Promise<string> {
  if (_bundleUrl) return _bundleUrl;
  logger.info('[GenerateVideo] Bundling Remotion...');
  const entryPoint = path.join(process.cwd(), 'remotion', 'index.ts');
  _bundleUrl = await bundle({
    entryPoint,
    webpackOverride: (config) => ({
      ...config,
      externals: [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'edge-tts',
      ],
    }),
  });
  return _bundleUrl;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limit — video rendering is expensive
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  // Admin only
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let lessonId: string;
  try {
    const body = await request.json();
    lessonId = body.lesson_id;
    if (!lessonId) return safeError('lesson_id is required', 400);
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const supabase = await createClient();
  const adminDb = await requireAdminClient();
  if (!adminDb) return safeError('Service unavailable', 503);

  // ── 1. Fetch lesson ─────────────────────────────────────────────────────────
  const { data: lesson, error: fetchErr } = await supabase
    .from('course_lessons')
    .select('id, title, script, bullet_points, duration_seconds, course_id, video_status')
    .eq('id', lessonId)
    .maybeSingle();

  if (fetchErr || !lesson) return safeError('Lesson not found', 404);
  if (lesson.video_status === 'rendering') {
    return safeError('Video is already rendering', 409);
  }

  // ── 2. Mark as rendering ────────────────────────────────────────────────────
  await adminDb.from('course_lessons').update({ video_status: 'rendering' }).eq('id', lessonId);

  // Fetch course title for branding
  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', lesson.course_id)
    .maybeSingle();

  const courseTitle = course?.title ?? 'Elevate LMS';
  const script = lesson.script ?? lesson.title;
  const bulletPoints: string[] = Array.isArray(lesson.bullet_points) ? lesson.bullet_points : [];

  try {
    // ── 3. Build scenes ───────────────────────────────────────────────────────
    const rawScenes = buildScenesFromScript({
      title: lesson.title,
      script,
      bullet_points: bulletPoints,
      duration_seconds: lesson.duration_seconds ?? undefined,
    });

    // ── 4. Fetch Pexels clips + images per scene ──────────────────────────────
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'elevate-video-'));
    const outputDir = path.join(process.cwd(), 'public', 'generated', 'lessons');
    await mkdir(outputDir, { recursive: true });

    const FPS = 30;
    // Estimate frames: ~150 words/min at -5% rate → seconds from narration length
    function narrationFrames(narration: string): number {
      const words = narration.split(/\s+/).length;
      const secs = Math.max(6, Math.ceil((words / 140) * 60));
      return secs * FPS;
    }

    const scenes: SceneData[] = await Promise.all(
      rawScenes.map(async (raw, i): Promise<SceneData> => {
        // Fetch clip and image in parallel
        const [clipUrl, imageUrl] = await Promise.all([
          getPexelsVideoClip(raw.clip_keyword, { minDuration: 5, maxDuration: 20 }),
          getPexelsImage(raw.clip_keyword).then(
            (url) => url ?? getPollinationsImage(raw.clip_keyword),
          ),
        ]);

        // Generate per-scene TTS audio
        let audioSrc: string | null = null;
        try {
          const audioBuffer = await generateEdgeTTS(raw.narration, {
            voice: EDGE_TTS_VOICES.marcus,
            rate: '-5%',
          });
          const audioPath = path.join(tmpDir, `scene-${i}.mp3`);
          await writeFile(audioPath, audioBuffer);
          audioSrc = audioPath;
        } catch (err) {
          // audit-safe: err.message goes to logger only, not HTTP response
          logger.warn('[GenerateVideo] TTS failed for scene ' + i, err);
        }

        return {
          ...raw,
          clipUrl,
          imageUrl,
          audioSrc,
          durationFrames: narrationFrames(raw.narration),
        };
      }),
    );

    // ── 5. Render MP4 ─────────────────────────────────────────────────────────
    const totalFrames = calcSlideLessonFrames(scenes);
    const compositionProps: SlideLessonProps & Record<string, unknown> = {
      courseTitle,
      lessonTitle: lesson.title,
      scenes,
      primaryColor: '#f97316',
      accentColor: '#3b82f6',
      backgroundColor: '#0f172a',
      logoText: 'Elevate LMS',
    };

    const videoPath = path.join(outputDir, `lesson-${lessonId}.mp4`);
    const bundleUrl = await getBundleUrl();

    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: 'SlideLesson',
      inputProps: compositionProps,
    });

    await renderMedia({
      composition,
      serveUrl: bundleUrl,
      codec: 'h264',
      outputLocation: videoPath,
      inputProps: compositionProps,
      concurrency: Math.max(1, (os.cpus().length ?? 2) - 1),
      crf: 23,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct % 20 === 0) logger.info(`[GenerateVideo] ${pct}% — ${lessonId}`);
      },
    });

    // ── 6. Upload to Supabase Storage ─────────────────────────────────────────
    const videoBuffer = await readFile(videoPath);
    const storagePath = `lessons/${lessonId}/lesson-video.mp4`;

    const { error: uploadErr } = await adminDb.storage
      .from('course-videos')
      .upload(storagePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadErr) {
      logger.error('[GenerateVideo] Storage upload failed: ' + uploadErr.message);
      throw new Error('Storage upload failed: ' + uploadErr.message);
    }

    const { data: urlData } = adminDb.storage.from('course-videos').getPublicUrl(storagePath);

    const videoUrl = urlData.publicUrl;
    const durationSeconds = Math.round(totalFrames / FPS);

    // ── 7. Update lesson record ───────────────────────────────────────────────
    await adminDb
      .from('course_lessons')
      .update({
        video_url: videoUrl,
        video_status: 'complete',
        duration_seconds: durationSeconds,
        scene_data: rawScenes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId);

    // Clean up temp files
    await Promise.all([
      unlink(videoPath).catch(() => {}),
      ...scenes.filter((s) => s.audioSrc).map((s) => unlink(s.audioSrc!).catch(() => {})),
    ]);

    logger.info(`[GenerateVideo] Complete: ${lessonId} → ${videoUrl}`);

    return NextResponse.json({
      success: true,
      video_url: videoUrl,
      duration_seconds: durationSeconds,
      scene_count: scenes.length,
    });
  } catch (err) {
    // Mark failed
    await adminDb.from('course_lessons').update({ video_status: 'failed' }).eq('id', lessonId);

    return safeInternalError(err, 'Video generation failed');
  }
}

// ── GET /api/generate-video?lesson_id=<id> — status check ────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const lessonId = request.nextUrl.searchParams.get('lesson_id');
  if (!lessonId) return safeError('lesson_id is required', 400);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('course_lessons')
    .select('id, title, video_url, video_status, duration_seconds, scene_data')
    .eq('id', lessonId)
    .maybeSingle();

  if (error || !data) return safeError('Lesson not found', 404);

  return NextResponse.json({
    lesson_id: data.id,
    title: data.title,
    video_url: data.video_url,
    video_status: data.video_status,
    duration_seconds: data.duration_seconds,
    scene_count: Array.isArray(data.scene_data) ? data.scene_data.length : null,
  });
}
