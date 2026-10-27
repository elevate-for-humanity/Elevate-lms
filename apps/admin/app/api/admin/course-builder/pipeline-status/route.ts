import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VIDEO_PENDING_STATES = new Set(['queued', 'rendering', 'running', 'processing']);
const VIDEO_COMPLETE_STATES = new Set(['complete', 'completed']);
const VIDEO_FAILED_STATES = new Set(['failed', 'error']);

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId')?.trim();
    const courseSlug = url.searchParams.get('slug')?.trim();

    if (!courseId && !courseSlug) {
      return safeError('courseId or slug query param is required', 400);
    }

    const db = await requireAdminClient();
    let courseQuery = db.from('courses').select('id, slug, title, status, created_at, updated_at');
    courseQuery = courseId ? courseQuery.eq('id', courseId) : courseQuery.eq('slug', courseSlug!);
    const { data: course, error: courseErr } = await courseQuery.maybeSingle();

    if (courseErr) {
      return safeInternalError(courseErr, 'Failed to load course');
    }

    if (!course) {
      return safeError('Course not found', 404);
    }

    const [modulesRes, lessonsRes, jobsRes] = await Promise.all([
      db.from('course_modules').select('id', { count: 'exact', head: true }).eq('course_id', course.id),
      db
        .from('course_lessons')
        .select('id, title, slug, order_index, content, learning_objectives, video_status, video_url, media_origin, media_quality_status')
        .eq('course_id', course.id),
      db.from('video_jobs').select('id, status, review_status, retry_count, failure_class, error_message, lease_expires_at, dead_lettered_at').eq('course_id', course.id),
    ]);

    if (modulesRes.error) {
      return safeInternalError(modulesRes.error, 'Failed to load module count');
    }
    if (lessonsRes.error) {
      return safeInternalError(lessonsRes.error, 'Failed to load lessons');
    }
    if (jobsRes.error) {
      return safeInternalError(jobsRes.error, 'Failed to load video jobs');
    }

    const lessons = lessonsRes.data ?? [];
    const jobs = jobsRes.data ?? [];

    const lessonCount = lessons.length;
    const moduleCount = modulesRes.count ?? 0;

    let lessonsWithContent = 0;
    let lessonsMissingContent = 0;
    let lessonsWithObjective = 0;
    let videosComplete = 0;
    let videosPending = 0;
    let videosFailed = 0;
    let videosMissing = 0;
    const mediaOrigins: Record<string, number> = {};
    const mediaGaps: Array<{
      lessonId: string;
      title: string;
      slug: string;
      orderIndex: number;
      videoStatus: string;
      mediaOrigin: string | null;
      qualityStatus: string | null;
      reason: 'missing' | 'pending' | 'failed' | 'qa_pending';
    }> = [];

    for (const lesson of lessons) {
      const hasContent =
        (typeof lesson.content === 'string' && lesson.content.trim().length > 0) ||
        (lesson.content !== null &&
          typeof lesson.content === 'object' &&
          Object.keys(lesson.content as Record<string, unknown>).length > 0);
      if (hasContent) {
        lessonsWithContent += 1;
      } else {
        lessonsMissingContent += 1;
      }

      const objectives = lesson.learning_objectives;
      const hasObjective =
        (Array.isArray(objectives) && objectives.length > 0) ||
        (typeof objectives === 'string' && objectives.trim().length > 0) ||
        (objectives !== null &&
          typeof objectives === 'object' &&
          Object.keys(objectives as Record<string, unknown>).length > 0);
      if (hasObjective) lessonsWithObjective += 1;

      const state = String(lesson.video_status ?? '').toLowerCase();
      const origin = String(lesson.media_origin ?? 'none').toLowerCase();
      mediaOrigins[origin] = (mediaOrigins[origin] ?? 0) + 1;
      const hasVideoUrl = typeof lesson.video_url === 'string' && lesson.video_url.trim().length > 0;

      // Completion is based on playable, quality-approved media, not on who produced it.
      // Generated, uploaded, and licensed/assisted assets all use the same QA gate.
      const qualityApproved = lesson.media_quality_status === 'approved';
      if (VIDEO_COMPLETE_STATES.has(state) && hasVideoUrl && qualityApproved) {
        videosComplete += 1;
      } else {
        let reason: 'missing' | 'pending' | 'failed' | 'qa_pending' = 'missing';
        if (VIDEO_PENDING_STATES.has(state)) {
          videosPending += 1;
          reason = 'pending';
        } else if (VIDEO_FAILED_STATES.has(state)) {
          videosFailed += 1;
          reason = 'failed';
        } else if (hasVideoUrl && !qualityApproved) {
          videosMissing += 1;
          reason = 'qa_pending';
        } else {
          videosMissing += 1;
        }
        mediaGaps.push({
          lessonId: lesson.id,
          title: lesson.title ?? 'Untitled lesson',
          slug: lesson.slug ?? '',
          orderIndex: Number(lesson.order_index ?? 0),
          videoStatus: state || 'missing',
          mediaOrigin: lesson.media_origin ?? null,
          qualityStatus: lesson.media_quality_status ?? null,
          reason,
        });
      }
    }

    let queuedJobs = 0;
    let runningJobs = 0;
    let failedJobs = 0;
    let approvedJobs = 0;
    let staleJobs = 0;
    let storageFailures = 0;
    let retryBudgetExhausted = 0;
    let deadLetterJobs = 0;
    const now = Date.now();

    for (const job of jobs) {
      const state = String(job.status ?? '').toLowerCase();
      if (state === 'queued') queuedJobs += 1;
      else if (state === 'rendering' || state === 'running' || state === 'processing') runningJobs += 1;
      else if (VIDEO_FAILED_STATES.has(state)) failedJobs += 1;
      if (job.review_status === 'approved') approvedJobs += 1;
      if (job.lease_expires_at && new Date(job.lease_expires_at).getTime() < now && state === 'rendering') staleJobs += 1;
      if (job.failure_class === 'storage' || /413|request entity too large/i.test(job.error_message ?? '')) storageFailures += 1;
      if (Number(job.retry_count ?? 0) >= 3) retryBudgetExhausted += 1;
      if (job.dead_lettered_at) deadLetterJobs += 1;
    }

    const buildReady = moduleCount > 0 && lessonCount > 0 && lessonsMissingContent === 0;
    const mediaReady = lessonCount > 0 && videosComplete === lessonCount && videosPending === 0 && videosFailed === 0;
    const isComplete = buildReady && mediaReady;

    const completionPercent = lessonCount > 0
      ? Math.round(((lessonsWithContent + videosComplete) / (lessonCount * 2)) * 100)
      : 0;

    return NextResponse.json({
      ok: true,
      course: {
        id: course.id,
        title: course.title,
        status: course.status,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
      },
      pipeline: {
        isComplete,
        buildReady,
        mediaReady,
        completionPercent,
      },
      summary: {
        modules: moduleCount,
        lessons: lessonCount,
        lessonsWithContent,
        lessonsWithObjective,
        lessonsMissingContent,
        videosComplete,
        videosPending,
        videosFailed,
        videosMissing,
        queuedJobs,
        runningJobs,
        failedJobs,
        approvedJobs,
        staleJobs,
        storageFailures,
        retryBudgetExhausted,
        deadLetterJobs,
        mediaOrigins,
      },
      mediaGaps: mediaGaps.sort((a, b) => a.orderIndex - b.orderIndex),
      nextAction: isComplete
        ? 'Course generation pipeline complete.'
        : mediaReady
          ? 'Course content is ready. Verify learner-facing pages and publish status.'
          : buildReady
            ? videosMissing > 0
              ? `Course content is ready. ${videosMissing} lesson${videosMissing === 1 ? '' : 's'} still need approved playable media.`
              : 'Course content is ready. Media production or QA is still in progress.'
            : 'Course content generation is still in progress or has gaps to resolve.',
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load pipeline status');
  }
}
