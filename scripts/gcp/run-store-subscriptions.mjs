// This source is passed to Node in the existing Google Admin image.
// No database or QuickBooks credentials are granted to the dispatcher.
export const ADMIN_URL = 'https://elevate-admin-migration-aabnh2y32a-uc.a.run.app';
export const BILLING_JOB = 'projects/elegant-racer-299721/locations/us-central1/jobs/elevate-store-subscriptions';
const METADATA = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/';

export async function runStoreSubscriptions(environment = process.env, request = fetch) {
  if (!environment.CRON_SECRET || !environment.CLOUD_RUN_EXECUTION || !/^[a-f0-9]{40}$/.test(environment.EXPECTED_ADMIN_COMMIT || ''))
    throw new Error('Billing dispatcher configuration unavailable');
  const metadataHeaders = { 'Metadata-Flavor': 'Google' };
  const access = await request(METADATA + 'token', { headers: metadataHeaders, signal: AbortSignal.timeout(10000) });
  if (!access.ok) throw new Error('Google dispatcher identity unavailable');
  const { access_token: accessToken } = await access.json();
  if (!accessToken) throw new Error('Google dispatcher identity unavailable');
  let pageToken = '';
  do {
    const executions = await request('https://run.googleapis.com/v2/' + BILLING_JOB + '/executions?pageSize=100' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''), {
      headers: { Authorization: 'Bearer ' + accessToken }, signal: AbortSignal.timeout(10000),
    });
    if (!executions.ok) throw new Error('Billing execution inventory unavailable');
    const body = await executions.json();
    if ((body.executions || []).some((item) => item.name?.split('/').pop() !== environment.CLOUD_RUN_EXECUTION && !item.completionTime))
      return { skipped: true, reason: 'another_execution_active' };
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  const identity = await request(METADATA + 'identity?audience=' + encodeURIComponent(ADMIN_URL) + '&format=full', {
    headers: metadataHeaders, signal: AbortSignal.timeout(10000),
  });
  if (!identity.ok) throw new Error('Google Admin authorization unavailable');
  const idToken = await identity.text();
  if (!idToken) throw new Error('Google Admin authorization unavailable');
  const headers = { 'X-Serverless-Authorization': 'Bearer ' + idToken, Authorization: 'Bearer ' + environment.CRON_SECRET };
  const readiness = await request(ADMIN_URL + '/api/ready', { headers, signal: AbortSignal.timeout(20000) });
  const ready = await readiness.json().catch(() => ({}));
  if (!readiness.ok || ready.service !== 'admin' || ready.commit !== environment.EXPECTED_ADMIN_COMMIT || ready.ready !== true || ready.agenticExecutorReady !== true)
    throw new Error('Google Admin billing runtime is not ready');
  const health = await request(ADMIN_URL + '/api/health', { headers, signal: AbortSignal.timeout(20000) });
  const healthy = await health.json().catch(() => ({}));
  if (!health.ok || healthy.service !== 'admin' || healthy.commit !== environment.EXPECTED_ADMIN_COMMIT || healthy.healthy !== true || healthy.ready !== true || healthy.dependencies?.supabase?.ok !== true)
    throw new Error('Google Admin billing database is not ready');
  const results = [];
  for (const path of ['/api/cron/process-billing-fulfillment', '/api/cron/generate-billing-invoices']) {
    const response = await request(ADMIN_URL + path, { method: 'POST', headers, signal: AbortSignal.timeout(260000) });
    const body = await response.json().catch(() => ({}));
    // A 207 batch response still indicates failed delivery and must alert.
    if (response.status !== 200 || body.ok !== true)
      throw new Error('Google billing task failed: ' + path);
    results.push({ path, completed: Number(body.completed || 0), processed: Number(body.processed || 0) });
  }
  return { skipped: false, results };
}
