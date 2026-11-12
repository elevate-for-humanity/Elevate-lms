import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STUCK_HEARTBEAT_MS = 30 * 60_000;
const FAILURE_WINDOW_MS = 24 * 60 * 60_000;
const PHOTO_MODELS = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];

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
const PHOTO_MODELS = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];

/**
 * lib/ultimate-course-builder/adapters/google-teaching-photo.mjs authenticates to Vertex AI with the
 * runtime service account from the GCE metadata server (no API key env var); project/region/model come
 * from GOOGLE_CLOUD_PROJECT|GCP_PROJECT_ID, ULTIMATE_PHOTO_REGION and ULTIMATE_PHOTO_MODEL.
 */
async function probeTeachingPhotoProvider(): Promise<{ passed: boolean; message: string }> {
  const project = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCP_PROJECT_ID ?? 'elegant-racer-299721';
  const region = process.env.ULTIMATE_PHOTO_REGION ?? 'us';
  const model = process.env.ULTIMATE_PHOTO_MODEL ?? 'gemini-3.1-flash-image';
  if (!/^[a-z][a-z0-9-]+$/.test(project) || !['us', 'global'].includes(region) || !PHOTO_MODELS.includes(model)
    || (model === 'gemini-3.1-flash-lite-image' && region !== 'global')) {
    return { passed: false, message: 'Teaching photo provider configuration is invalid (GOOGLE_TEACHING_PHOTO_CONFIGURATION_INVALID).' };
  }
  try {
    const identity = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' }, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(3000),
    });
    const token = identity.ok ? await identity.json().catch(() => null) : null;
    return typeof token?.access_token === 'string'
      ? { passed: true, message: `Google service-account identity available for Vertex AI teaching photos (${project}, ${region}, ${model}).` }
      : { passed: false, message: 'Google service-account identity unavailable (GOOGLE_TEACHING_PHOTO_IDENTITY_UNAVAILABLE).' };
  } catch {
    return { passed: false, message: 'Google metadata identity endpoint unreachable (GOOGLE_TEACHING_PHOTO_IDENTITY_UNAVAILABLE).' };
  }
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
      buildJobs: { passed: false, message: 'Ultimate build jobs table unavailable.' },
      stuckJobs: { passed: false, message: 'Stuck build job probe unavailable.' },
      failedJobs: { passed: false, message: 'Failed build job probe unavailable.' },
    };
    const photoProvider = await probeTeachingPhotoProvider();

    try {
      const db = await requireAdminClient();
      const now = Date.now();
      const [coursesResult, modulesResult, lessonsResult, queueResult, stuckResult, failedResult] = await Promise.all([
        db.from('courses').select('id').limit(1),
        db.from('course_modules').select('id').limit(1),
        db.from('course_lessons').select('id').limit(1),
        db.from('ultimate_build_jobs').select('id', { head: true, count: 'exact' }).in('status', ['queued', 'running']),
        db.from('ultimate_build_jobs').select('id', { head: true, count: 'exact' }).eq('status', 'running')
          .or(`heartbeat_at.is.null,heartbeat_at.lt.${new Date(now - STUCK_HEARTBEAT_MS).toISOString()}`),
        db.from('ultimate_build_jobs').select('id', { head: true, count: 'exact' }).eq('status', 'failed')
          .gte('updated_at', new Date(now - FAILURE_WINDOW_MS).toISOString()),
      const staleLease = new Date(Date.now() - 30 * 60_000).toISOString();
      const failedSince = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const [coursesResult, modulesResult, lessonsResult, jobsResult, stuckResult, failedResult] = await Promise.all([
        db.from('courses').select('id').limit(1),
        db.from('course_modules').select('id').limit(1),
        db.from('course_lessons').select('id').limit(1),
        db.from('ultimate_build_jobs').select('id').limit(1),
        db.from('ultimate_build_jobs').select('id', { count: 'exact', head: true })
          .eq('status', 'running').lt('lease_expires_at', staleLease),
        db.from('ultimate_build_jobs').select('id', { count: 'exact', head: true })
          .eq('status', 'failed').gte('updated_at', failedSince),
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
    } catch {
      const message = 'Course Builder database probe failed.';
      for (const check of Object.values(checks)) check.message = message;
      checks.buildJobs = {
        passed: !jobsResult.error,
        message: jobsResult.error ? 'ultimate_build_jobs table query failed.' : 'ultimate_build_jobs table query succeeded.',
      };
      checks.stuckJobs = stuckResult.error
        ? { passed: false, message: 'Stuck build job query failed.' }
        : { passed: (stuckResult.count ?? 0) === 0, message: `${stuckResult.count ?? 0} running build job(s) with a lease expired over 30 minutes ago.` };
      checks.failedJobs = failedResult.error
        ? { passed: false, message: 'Failed build job query failed.' }
        : { passed: (failedResult.count ?? 0) === 0, message: `${failedResult.count ?? 0} build job(s) failed in the last 24 hours.` };
    } catch {
      const message = 'Course Builder database probe failed.';
      checks.buildJobs.message = message;
      checks.stuckJobs.message = message;
      checks.failedJobs.message = message;
      checks.courses.message = message;
      checks.modules.message = message;
      checks.lessons.message = message;
    }

    const photo = photoCredentialCheck();
    return buildCapabilityHealth('courses', [
      { name: 'courses-table', passed: checks.courses.passed, required: true, message: checks.courses.message },
      { name: 'course-modules-table', passed: checks.modules.passed, required: true, message: checks.modules.message },
      { name: 'course-lessons-table', passed: checks.lessons.passed, required: true, message: checks.lessons.message },
      { name: 'job-queue', passed: checks.jobQueue.passed, required: true, message: checks.jobQueue.message },
      { name: 'stuck-jobs', passed: checks.stuckJobs.passed, required: false, message: checks.stuckJobs.message },
      { name: 'failed-jobs', passed: checks.failedJobs.passed, required: false, message: checks.failedJobs.message },
      { name: 'photo-credential', passed: photo.passed, required: false, message: photo.message },
      { name: 'ultimate-build-jobs-table', passed: checks.buildJobs.passed, required: true, message: checks.buildJobs.message },
      { name: 'stuck-build-jobs', passed: checks.stuckJobs.passed, required: false, message: checks.stuckJobs.message },
      { name: 'failed-build-jobs-24h', passed: checks.failedJobs.passed, required: false, message: checks.failedJobs.message },
      { name: 'teaching-photo-provider-credential', passed: photoProvider.passed, required: true, message: photoProvider.message },
    ]);
  });
}
