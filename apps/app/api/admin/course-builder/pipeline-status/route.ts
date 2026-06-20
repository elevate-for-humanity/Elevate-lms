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

    if (!courseId) {
      return safeError('courseId query param is required', 400);
    }

    const db = await requireAdminClient();

    const { data: course, error: courseErr } = await db
      .from('courses')
      .select('id, title, status, created_at, updated_at')
      .eq('id', courseId)
      .maybeSingle();

    if (courseErr) {
      return safeInternalError(courseErr, 'Failed to load course');
    }

    if (!course) {
      return safeError('Course not found', 404);
    }

    const [modulesRes, lessonsRes, jobsRes] = await Promise.all([
      db.from('course_modules').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
      db
        .from('course_lessons')
        .select('id, content, objective, video_status, video_url')
        .eq('course_id', courseId),
      db.from('video_jobs').select('id, status').eq('course_id', courseId),
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

    for (const lesson of lessons) {
      const hasContent = typeof lesson.content === 'string' && lesson.content.trim().length > 0;
      if (hasContent) {
        lessonsWithContent += 1;
      } else {
        lessonsMissingContent += 1;
      }

      const hasObjective = typeof lesson.objective === 'string' && lesson.objective.trim().length > 0;
      if (hasObjective) lessonsWithObjective += 1;

      const state = String(lesson.video_status ?? '').toLowerCase();
      const hasVideoUrl = typeof lesson.video_url === 'string' && lesson.video_url.trim().length > 0;

      if (VIDEO_COMPLETE_STATES.has(state) && hasVideoUrl) {
        videosComplete += 1;
      } else if (VIDEO_PENDING_STATES.has(state)) {
        videosPending += 1;
      } else if (VIDEO_FAILED_STATES.has(state)) {
        videosFailed += 1;
      } else if (!hasVideoUrl) {
        videosMissing += 1;
      }
    }

    let queuedJobs = 0;
    let runningJobs = 0;
    let failedJobs = 0;

    for (const job of jobs) {
      const state = String(job.status ?? '').toLowerCase();
      if (state === 'queued') queuedJobs += 1;
      else if (state === 'rendering' || state === 'running' || state === 'processing') runningJobs += 1;
      else if (VIDEO_FAILED_STATES.has(state)) failedJobs += 1;
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
      },
      nextAction: isComplete
        ? 'Course generation pipeline complete.'
        : mediaReady
          ? 'Course content is ready. Verify learner-facing pages and publish status.'
          : buildReady
            ? 'Course content is ready. Continue polling until media jobs complete.'
            : 'Course content generation is still in progress or has gaps to resolve.',
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load pipeline status');
  }
}
