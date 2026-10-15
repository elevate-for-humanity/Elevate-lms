import { dispatchGoogleDeployment } from './dispatch-production-workflow';
import { logger } from '@/lib/logger';

const PROJECT = 'elegant-racer-299721';
const REGION = 'us-central1';
const JOB = 'elevate-course-builder';

/**
 * Admin's Cloud Run service account can start its own finite worker without
 * requesting a personal Cloud Shell login or a GitHub PAT. This path requires
 * roles/run.jobsExecutor (or run.jobs.run) on the worker job, granted to the
 * Admin runtime service account. Never embed user credentials in the browser.
 */
async function launchWithGoogleRuntimeIdentity() {
  const metadata = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(5000) },
  );
  if (!metadata.ok) throw new Error('GOOGLE_RUNTIME_IDENTITY_UNAVAILABLE');
  const tokenPayload = await metadata.json() as { access_token?: string };
  if (!tokenPayload.access_token) throw new Error('GOOGLE_RUNTIME_TOKEN_MISSING');

  const target = `projects/${PROJECT}/locations/${REGION}/jobs/${JOB}`;
  const endpoint = `https://run.googleapis.com/v2/${target}`;
  const headers = { Authorization: `Bearer ${tokenPayload.access_token}`, Accept: 'application/json' };

  // Check active executions before launching. Queue locking is a second line
  // of protection; an already-running Cloud Run execution is never duplicated.
  const existing = await fetch(`${endpoint}/executions?pageSize=20`, {
    headers, cache: 'no-store', signal: AbortSignal.timeout(12000),
  });
  if (!existing.ok) throw new Error(`GOOGLE_EXECUTION_READ_REJECTED:${existing.status}`);
  const executions = await existing.json() as {
    executions?: Array<{ name?: string; completionTime?: string; cancelledCount?: number }>;
  };
  const active = executions.executions?.find((execution) => !execution.completionTime &&
    !execution.cancelledCount);
  if (active) {
    return { dispatched: true, launchMode: 'already-active', executionVerified: false,
      message: 'An existing Google Cloud worker execution is active. The dashboard will monitor its queue heartbeat.' };
  }
  const response = await fetch(`${endpoint}:run`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({}), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`GOOGLE_WORKER_EXECUTION_REJECTED:${response.status}`);
  const operation = await response.json() as { name?: string };
  return { dispatched: true, launchMode: 'google-runtime', executionVerified: false,
    operation: operation.name,
    message: 'Google Cloud accepted the worker execution. Waiting for its first queue heartbeat.' };
}

/** Queue insertion happens before this function. Never reset finished lessons. */
export async function requestCourseWorker(dispatch = () => dispatchGoogleDeployment('course-builder')) {
  try {
    return await launchWithGoogleRuntimeIdentity();
  } catch (googleError) {
    logger.warn('Direct Google worker execution unavailable', {
      reason: googleError instanceof Error ? googleError.message : 'unknown',
    });
  }
  try {
    const result = await dispatch();
    return { dispatched: true, launchMode: 'github-workflow', executionVerified: false, actionsUrl: result.actionsUrl,
      message: 'Google worker launch requested through the trusted GitHub workflow. Waiting for a live worker heartbeat.' };
  } catch (error) {
    const reason = error instanceof Error && /HTTP 401/.test(error.message) ? 'authentication_rejected' : 'direct_dispatch_unavailable';
    logger.warn('Course worker launch deferred to durable coordinator', { reason });
    return { dispatched: false, launchMode: 'scheduled', executionVerified: false, dispatchError: reason,
      message: 'Course progress is saved, but worker execution was not accepted. Admin runtime needs permission to execute the Google Cloud job or a working trusted dispatch connection. No course restart was confirmed.' };
  }
}
