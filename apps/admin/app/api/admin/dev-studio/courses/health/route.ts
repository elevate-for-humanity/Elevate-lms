import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STUCK_HEARTBEAT_MS = 30 * 60_000;
const FAILURE_WINDOW_MS = 24 * 60 * 60_000;
const PHOTO_MODELS = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];

/** PostgREST filters cannot compare attempts with another column. Inspect the
 * queued rows in bounded pages and never call a partial count healthy. */
async function queuedRetryBudgetCheck(db: Awaited<ReturnType<typeof requireAdminClient>>) {
  const unverified = { passed: false, message: 'Queued job retry budgets could not be fully inspected.' };
  const seen = new Set<string>();
  let total: number | null = null;
  let exhausted = 0;
  try {
    for (let page = 0; page < 20; page++) {
      const { data, error, count } = await db.from('ultimate_build_jobs')
        .select('id,attempts,max_attempts', { count: 'exact' }).eq('status', 'queued')
        .order('id', { ascending: true }).range(seen.size, seen.size + 499);
      if (error || !Array.isArray(data) || typeof count !== 'number' || !Number.isInteger(count) || count < 0 ||
          (total !== null && count !== total)) return unverified;
      total = count;
      for (const job of data) {
        if (typeof job.id !== 'string' || seen.has(job.id) ||
            !Number.isInteger(job.attempts) || job.attempts < 0 ||
            !Number.isInteger(job.max_attempts) || job.max_attempts <= 0) return unverified;
        seen.add(job.id);
        if (job.attempts >= job.max_attempts) exhausted++;
      }
      if (seen.size === total) return {
        passed: exhausted === 0,
        message: exhausted === 0 ? 'No queued course build job has exhausted its retry budget.'
          : `${exhausted} queued course build job(s) cannot be claimed because their retry budget is exhausted. Inspect the saved failure and verify its correction before authorizing recovery.`,
      };
      if (seen.size > total || data.length === 0) return unverified;
    }
  } catch {
    // Query failures are advisory capability state, never hidden as zero jobs.
  }
  return unverified;
}

/** Mirrors the configuration gate in google-teaching-photo.mjs, which
 * authenticates through the Cloud Run metadata identity, not an API key. */
function photoCredentialCheck() {
  const project = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCP_PROJECT_ID ?? 'elegant-racer-299721';
  const region = process.env.ULTIMATE_PHOTO_REGION ?? 'us';
  const model = process.env.ULTIMATE_PHOTO_MODEL ?? 'gemini-3.1-flash-image';
  const valid = /^[a-z][a-z0-9-]+$/.test(project) && ['us', 'global'].includes(region) &&
    PHOTO_MODELS.includes(model) && !(model === 'gemini-3.1-flash-lite-image' && region !== 'global');
  return {
    passed: valid,
    message: valid
      ? 'Teaching photo configuration valid (GOOGLE_CLOUD_PROJECT/GCP_PROJECT_ID, ULTIMATE_PHOTO_REGION, ULTIMATE_PHOTO_MODEL); worker uses its Cloud Run service identity.'
      : 'Teaching photo configuration invalid: check GOOGLE_CLOUD_PROJECT/GCP_PROJECT_ID, ULTIMATE_PHOTO_REGION and ULTIMATE_PHOTO_MODEL.',
  };
}

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const checks = {
      courses: { passed: false, message: 'Courses table unavailable.' },
      modules: { passed: false, message: 'Course modules table unavailable.' },
      lessons: { passed: false, message: 'Course lessons table unavailable.' },
      jobQueue: { passed: false, message: 'Course build job queue unavailable.' },
      stuckJobs: { passed: false, message: 'Running course build jobs could not be inspected.' },
      failedJobs: { passed: false, message: 'Recent course build failures could not be inspected.' },
      exhaustedQueued: { passed: false, message: 'Queued job retry budgets could not be inspected.' },
    };

    try {
      const db = await requireAdminClient();
      const now = Date.now();
      const [coursesResult, modulesResult, lessonsResult, queueResult, stuckResult, failedResult, exhaustedQueued] = await Promise.all([
        db.from('courses').select('id').limit(1),
        db.from('course_modules').select('id').limit(1),
        db.from('course_lessons').select('id').limit(1),
        db.from('ultimate_build_jobs').select('id', { head: true, count: 'exact' }).in('status', ['queued', 'running']),
        db.from('ultimate_build_jobs').select('id', { head: true, count: 'exact' }).eq('status', 'running')
          .or(`heartbeat_at.is.null,heartbeat_at.lt.${new Date(now - STUCK_HEARTBEAT_MS).toISOString()}`),
        db.from('ultimate_build_jobs').select('id', { head: true, count: 'exact' }).eq('status', 'failed')
          .gte('updated_at', new Date(now - FAILURE_WINDOW_MS).toISOString()),
        queuedRetryBudgetCheck(db),
      ]);

      checks.courses = {
        passed: !coursesResult.error,
        message: coursesResult.error ? 'Canonical courses table query failed.' : 'Canonical courses table query succeeded.',
      };
      checks.modules = {
        passed: !modulesResult.error,
        message: modulesResult.error ? 'Canonical course_modules table query failed.' : 'Canonical course_modules table query succeeded.',
      };
      checks.lessons = {
        passed: !lessonsResult.error,
        message: lessonsResult.error ? 'Canonical course_lessons table query failed.' : 'Canonical course_lessons table query succeeded.',
      };
      checks.jobQueue = {
        passed: !queueResult.error,
        message: queueResult.error ? 'ultimate_build_jobs query failed.' : `${queueResult.count ?? 0} course build job(s) queued or running.`,
      };
      checks.stuckJobs = {
        passed: !stuckResult.error && (stuckResult.count ?? 0) === 0,
        message: stuckResult.error ? 'Running job heartbeat query failed.'
          : (stuckResult.count ?? 0) === 0 ? 'No running job has a heartbeat older than 30 minutes.'
          : `${stuckResult.count} running job(s) have no heartbeat in 30 minutes.`,
      };
      checks.failedJobs = {
        passed: !failedResult.error && (failedResult.count ?? 0) === 0,
        message: failedResult.error ? 'Recent job failure query failed.'
          : (failedResult.count ?? 0) === 0 ? 'No course build job failed in the last 24 hours.'
          : `${failedResult.count} course build job(s) failed in the last 24 hours.`,
      };
      checks.exhaustedQueued = exhaustedQueued;
    } catch {
      const message = 'Course Builder database probe failed.';
      for (const check of Object.values(checks)) check.message = message;
    }

    const photo = photoCredentialCheck();
    return buildCapabilityHealth('courses', [
      { name: 'courses-table', passed: checks.courses.passed, required: true, message: checks.courses.message },
      { name: 'course-modules-table', passed: checks.modules.passed, required: true, message: checks.modules.message },
      { name: 'course-lessons-table', passed: checks.lessons.passed, required: true, message: checks.lessons.message },
      { name: 'job-queue', passed: checks.jobQueue.passed, required: true, message: checks.jobQueue.message },
      { name: 'stuck-jobs', passed: checks.stuckJobs.passed, required: false, message: checks.stuckJobs.message },
      { name: 'failed-jobs', passed: checks.failedJobs.passed, required: false, message: checks.failedJobs.message },
      { name: 'queued-retry-budgets', passed: checks.exhaustedQueued.passed, required: false, message: checks.exhaustedQueued.message },
      { name: 'photo-credential', passed: photo.passed, required: false, message: photo.message },
    ]);
  });
}
