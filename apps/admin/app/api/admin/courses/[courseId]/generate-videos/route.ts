/**
 * POST /api/admin/courses/[courseId]/generate-videos
 *
 * Generates production-quality lesson videos for any course that has a
 * video_profile or video_config set. The pipeline produces:
 *   - Branded intro/outro cards
 *   - Topic-matched Pexels b-roll with color grade
 *   - OpenAI TTS narration (voice/speed from profile)
 *   - Chapter title + lower third overlays
 *   - Burned-in captions (Whisper)
 *   - Final MP4 uploaded to Supabase course-videos/{programSlug}/{slug}.mp4
 *
 * Body: { lessonId?: string, force?: boolean }
 *   lessonId — regenerate a single lesson
 *   force    — regenerate even if video_url already set
 *
 * Requires: ffmpeg, OPENAI_API_KEY, PEXELS_API_KEY
 * NOTE: ffmpeg must be available in the runtime environment (Northflank container or local dev).
 */

import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { processLesson, resolveVideoProfile } from '@/lib/video/pipeline';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const body = await request.json().catch(() => ({}));
  const { lessonId, force = false } = body as { lessonId?: string; force?: boolean };

  // Verify ffmpeg is available
  try {
    execSync('which ffmpeg', { stdio: 'pipe' });
  } catch {
    return safeError('ffmpeg not available in this environment. Run on Northflank or locally.', 503);
  }

  if (!process.env.OPENAI_API_KEY) return safeError('OPENAI_API_KEY not set', 503);
  if (!process.env.PEXELS_API_KEY) return safeError('PEXELS_API_KEY not set', 503);

  const sb = await requireAdminClient();
  if (!sb) return safeError('Service unavailable', 503);

  // Load course to get video_profile / video_config
  const { data: course, error: courseErr } = await sb
    .from('courses')
    .select('id, title, slug, video_config, video_profile')
    .eq('id', courseId)
    .maybeSingle();

  if (courseErr || !course) return safeError('Course not found', 404);

  // Require a video profile to be set
  if (!course.video_config && !course.video_profile) {
    return safeError(
      'This course has no video_profile or video_config set. ' +
        'Add a video_profile to the course row to enable video generation.',
      422,
    );
  }

  const profile = resolveVideoProfile(course);

  // Fetch lessons to process
  let query = sb
    .from('course_lessons')
    .select('id, title, slug, content, lesson_type, video_url, module_id')
    .eq('course_id', courseId)
    .order('order_index');

  if (lessonId) {
    query = query.eq('id', lessonId) as any;
  } else if (!force) {
    query = query.or('video_url.is.null,video_url.like./videos/%') as any;
  }

  const { data: lessons, error: lessonsErr } = await query;
  if (lessonsErr) return safeInternalError(lessonsErr, 'Failed to fetch lessons');
  if (!lessons?.length) {
    return NextResponse.json({
      ok: true,
      generated: 0,
      message: 'All lessons already have videos',
    });
  }

  // Load module titles for chapter overlays
  const moduleIds = [...new Set(lessons.map((l: any) => l.module_id).filter(Boolean))];
  const moduleMap: Record<string, string> = {};
  if (moduleIds.length) {
    const { data: modules } = await sb
      .from('course_modules')
      .select('id, title')
      .in('id', moduleIds);
    for (const m of modules ?? []) moduleMap[m.id] = m.title;
  }

  const tmpDir = fs.mkdtempSync(`${os.tmpdir()}/vid-gen-`);
  const results: { id: string; title: string; video_url?: string; error?: string }[] = [];

  for (const lesson of lessons) {
    try {
      const lessonWithModule = {
        ...lesson,
        module_title: lesson.module_id ? (moduleMap[lesson.module_id] ?? null) : null,
      };

      const videoUrl = await processLesson(lessonWithModule as any, profile, tmpDir, {
        onProgress: (msg) => logger.info('[' + lesson.title + '] ' + msg),
      });

      await sb.from('course_lessons').update({ video_url: videoUrl }).eq('id', lesson.id);
      results.push({ id: lesson.id, title: lesson.title, video_url: videoUrl });
    } catch (err: any) {
      logger.error('Video gen failed for ' + lesson.title + ':', err);
      results.push({ id: lesson.id, title: lesson.title, error: 'Video generation failed' });
    }
  }

  try {
    fs.rmSync(tmpDir, { recursive: true });
  } catch (err) {
    logger.debug('Failed to clean video temp directory', { tmpDir, err });
  }

  const generated = results.filter((r) => r.video_url).length;
  const failed = results.filter((r) => r.error).length;

  return NextResponse.json({ ok: true, generated, failed, results, profile: profile.programSlug });
}
