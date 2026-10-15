import 'server-only';

/**
 * Admin Cloud Run service identity can execute the already-deployed finite job
 * when the GitHub dispatch credential is unavailable. Never use user OAuth,
 * shell credentials, service-account key files, or an arbitrary job name.
 * The worker performs the atomic Supabase claim and retains its checkpoints.
 */
const PROJECT = 'elegant-racer-299721';
const REGION = 'us-central1';
const JOB = 'elevate-course-builder';
const API = `https://run.googleapis.com/v2/projects/${PROJECT}/locations/${REGION}/jobs/${JOB}`;

type Http = typeof fetch;
export async function startDeployedCourseWorker({
  request = fetch,
  env = process.env,
}: { request?: Http; env?: NodeJS.ProcessEnv } = {}) {
  if (!env.K_SERVICE) throw new Error('GOOGLE_CLOUD_RUN_ADMIN_IDENTITY_REQUIRED');
  const tokenResponse = await request(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(5000) },
  );
  if (!tokenResponse.ok) throw new Error('GOOGLE_SERVICE_IDENTITY_UNAVAILABLE');
  const token = await tokenResponse.json();
  if (typeof token.access_token !== 'string' || !token.access_token)
    throw new Error('GOOGLE_ACCESS_TOKEN_MISSING');
  const headers = {
    authorization: `Bearer ${token.access_token}`,
    'content-type': 'application/json',
  };

  // Confirm job exists and is owned by this exact production project/region.
  const jobResponse = await request(API, { headers, signal: AbortSignal.timeout(10000) });
  if (!jobResponse.ok)
    throw new Error(`GOOGLE_COURSE_JOB_UNAVAILABLE_HTTP_${jobResponse.status}`);
  const job = await jobResponse.json();
  if (job.name !== `projects/${PROJECT}/locations/${REGION}/jobs/${JOB}`)
    throw new Error('GOOGLE_COURSE_JOB_IDENTITY_MISMATCH');

  // No new execution if a prior execution is still active.
  const executionsResponse = await request(`${API}/executions?pageSize=50`, {
    headers, signal: AbortSignal.timeout(10000),
  });
  if (!executionsResponse.ok)
    throw new Error(`GOOGLE_COURSE_EXECUTIONS_UNAVAILABLE_HTTP_${executionsResponse.status}`);
  const executions = await executionsResponse.json();
  if (!Array.isArray(executions.executions ?? [])) throw new Error('GOOGLE_EXECUTION_LIST_INVALID');
  const running = (executions.executions ?? []).find((execution: any) =>
    !execution.completionTime && !execution.cancelledCount &&
    !execution.conditions?.some((condition: any) =>
      condition.type === 'Completed' && condition.state === 'CONDITION_SUCCEEDED',
    ),
  );
  if (running)
    return { dispatched: true, alreadyExecuting: true, executionVerified: true,
      launchMode: 'google-cloud-run', executionName: running.name ?? null,
      message: 'Google Cloud Run course worker already has an active execution. Waiting for a fresh Supabase heartbeat.' };

  const runResponse = await request(`${API}:run`, {
    method: 'POST', headers, body: JSON.stringify({}), signal: AbortSignal.timeout(15000),
  });
  if (!runResponse.ok)
    throw new Error(`GOOGLE_COURSE_EXECUTION_REFUSED_HTTP_${runResponse.status}`);
  const operation = await runResponse.json();
  if (typeof operation.name !== 'string' || !operation.name)
    throw new Error('GOOGLE_COURSE_EXECUTION_OPERATION_MISSING');
  return { dispatched: true, executionVerified: false, launchMode: 'google-cloud-run',
    operationName: operation.name,
    message: 'Google Cloud Run accepted the worker execution. Waiting for an authenticated Supabase claim and heartbeat.' };
}
