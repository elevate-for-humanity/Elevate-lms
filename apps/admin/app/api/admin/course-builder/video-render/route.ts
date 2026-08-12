/**
 * Canonical production lesson video renderer.
 *
 * Preserves the existing ffmpeg + b-roll + TTS + caption pipeline while moving
 * service ownership into Admin Course Builder. Use the video-queue endpoint for
 * asynchronous missing-video jobs; use this endpoint when an operator explicitly
 * requests a production render now.
 */
import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { processLesson, resolveVideoProfile } from '@/lib/video/pipeline';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BodySchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid().optional(),
  force: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid production render request', 400);
  const { courseId, lessonId, force } = parsed.data;

  try {
    execSync('which ffmpeg', { stdio: 'pipe' });
  } catch {
    return safeError('ffmpeg is not available in this Admin runtime.', 503);
  }
  if (!process.env.OPENAI_API_KEY) return safeError('OPENAI_API_KEY is not configured', 503);
  if (!process.env.PEXELS_API_KEY) return safeError('PEXELS_API_KEY is not configured', 503);

  const db = await requireAdminClient();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,title,slug,video_config,video_profile')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) return safeInternalError(courseError, 'Failed to load course');
  if (!course) return safeError('Course not found', 404);
  if (!course.video_config && !course.video_profile) {
    return safeError('This course has no video_profile or video_config. Configure a production video profile before rendering.', 422);
  }

  const profile = resolveVideoProfile(course);
  let query = db
    .from('course_lessons')
    .select('id,title,slug,content,lesson_type,video_url,module_id,video_status')
    .eq('course_id', courseId)
    .order('order_index');
  if (lessonId) query = query.eq('id', lessonId) as typeof query;
  else if (!force) query = query.or('video_url.is.null,video_status.neq.complete') as typeof query;

  const { data: lessons, error: lessonsError } = await query;
  if (lessonsError) return safeInternalError(lessonsError, 'Failed to load lessons for video rendering');
  if (!lessons?.length) return NextResponse.json({ ok: true, generated: 0, failed: 0, message: 'No lessons require production rendering.' });

  const moduleIds = [...new Set(lessons.map((lesson: any) => lesson.module_id).filter(Boolean))];
  const moduleMap: Record<string, string> = {};
  if (moduleIds.length) {
    const { data: modules } = await db.from('course_modules').select('id,title').in('id', moduleIds);
    for (const module of modules ?? []) moduleMap[module.id] = module.title;
  }

  const tmpDir = fs.mkdtempSync(`${os.tmpdir()}/course-render-`);
  const results: Array<{ id: string; title: string; video_url?: string; error?: string }> = [];
  try {
    for (const lesson of lessons) {
      try {
        await db.from('course_lessons').update({ video_status: 'rendering', video_error: null, updated_at: new Date().toISOString() }).eq('id', lesson.id);
        const videoUrl = await processLesson(
          { ...lesson, module_title: lesson.module_id ? moduleMap[lesson.module_id] ?? null : null } as any,
          profile,
          tmpDir,
          { onProgress: (message) => logger.info(`[course-video:${lesson.id}] ${message}`) },
        );
        const now = new Date().toISOString();
        const { error: updateError } = await db.from('course_lessons').update({
          video_url: videoUrl,
          video_status: 'complete',
          video_error: null,
          video_generated_at: now,
          updated_at: now,
        }).eq('id', lesson.id);
        if (updateError) throw updateError;
        results.push({ id: lesson.id, title: lesson.title, video_url: videoUrl });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Video generation failed';
        await db.from('course_lessons').update({ video_status: 'failed', video_error: message, updated_at: new Date().toISOString() }).eq('id', lesson.id);
        logger.error(`[course-video:${lesson.id}] production render failed`, error);
        results.push({ id: lesson.id, title: lesson.title, error: message });
      }
    }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (error) { logger.debug('Failed to clean video temp directory', { tmpDir, error }); }
  }

  const generated = results.filter((result) => result.video_url).length;
  const failed = results.filter((result) => result.error).length;
  await logAdminAudit({
    action: AdminAction.BULK_CONTENT_GENERATED,
    actorId: auth.id,
    entityType: 'courses',
    entityId: courseId,
    metadata: { operation: 'course.production_video_render', generated, failed, lessonId: lessonId ?? null, force },
    req: request,
  });

  return NextResponse.json({ ok: failed === 0, generated, failed, results, profile: profile.programSlug });
}
