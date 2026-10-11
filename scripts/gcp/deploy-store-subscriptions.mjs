import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { google, PROJECT } from './runtime-config.mjs';
import { ADMIN_URL, BILLING_JOB } from './run-store-subscriptions.mjs';
export function dispatcherSource() {
  const source = readFileSync(new URL('./run-store-subscriptions.mjs', import.meta.url), 'utf8').replace(/^export /gm, '');
  if (source.includes('~')) throw new Error('Dispatcher argument delimiter collision');
  return source + '\nrunStoreSubscriptions().then(result => console.log(JSON.stringify(result))).catch(() => { console.error("Google billing dispatcher failed; inspect task status."); process.exitCode = 1; });';
}
async function main() {
  const sha = process.env.IMAGE_SHA;
  if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('Full Admin image SHA required');
  if (!process.env.GOOGLE_ADMIN_TOKEN || !process.env.GOOGLE_MARKETING_TOKEN)
    throw new Error('Authenticated Google workflow tokens are required');
  const name = 'elevate-store-subscriptions', region = 'us-central1';
  const image = `us-central1-docker.pkg.dev/${PROJECT}/elevate/admin`;
  const digest = google(['artifacts','docker','images','describe',`${image}:${sha}`,'--project',PROJECT,'--format=value(image_summary.digest)']);
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error('Verified Admin image digest required');
  // The administrator-created resource carries the confined IAM bindings.
  google(['run','jobs','describe',name,'--project',PROJECT,'--region',region,'--format=value(metadata.name)']);
  const source = dispatcherSource();
  google(['run','jobs','deploy',name,'--project',PROJECT,'--region',region,'--image',`${image}@${digest}`,
    '--service-account',`elevate-billing-runtime@${PROJECT}.iam.gserviceaccount.com`,
    '--command','node','--args',`^~^--input-type=module~-e~${source}`,
    '--set-secrets','CRON_SECRET=elevate-billing-cron-secret:latest',
    '--set-env-vars',`EXPECTED_ADMIN_COMMIT=${sha}`,
    '--cpu','1','--memory','512Mi','--tasks','1','--parallelism','1','--max-retries','0','--task-timeout','600s','--quiet']);
  const job = JSON.parse(google(['run','jobs','describe',name,'--project',PROJECT,'--region',region,'--format=json']));
  const spec = job.spec?.template?.spec?.template?.spec;
  const container = spec?.containers?.[0];
  if (spec?.serviceAccountName !== `elevate-billing-runtime@${PROJECT}.iam.gserviceaccount.com` ||
      container?.image !== `${image}@${digest}` || container.args?.[2] !== source ||
      container.env?.find((item) => item.name === 'CRON_SECRET')?.valueFrom?.secretKeyRef?.name !== 'elevate-billing-cron-secret')
    throw new Error('Google billing dispatcher readback mismatch');
  // Native scheduling is enabled only after the live payment boundary passes.
  const adminToken = process.env.GOOGLE_ADMIN_TOKEN;
  const adminResponse = await fetch(ADMIN_URL + '/api/health', { headers: { 'X-Serverless-Authorization': 'Bearer ' + adminToken }, signal: AbortSignal.timeout(30000) });
  const adminHealth = await adminResponse.json().catch(() => ({}));
  if (adminResponse.status !== 200 || adminHealth.service !== 'admin' || adminHealth.commit !== sha || !adminHealth.healthy || !adminHealth.dependencies?.supabase?.ok)
    throw new Error('Dispatcher deployed; scheduling remains disabled until the repaired Admin runtime is verified.');
  const marketing = 'https://elevate-marketing-migration-aabnh2y32a-uc.a.run.app';
  const token = process.env.GOOGLE_MARKETING_TOKEN;
  const response = await fetch(marketing + '/api/health/quickbooks', { headers: { 'X-Serverless-Authorization': 'Bearer ' + token }, signal: AbortSignal.timeout(30000) });
  const billing = await response.json().catch(() => ({}));
  if (response.status !== 200 || !billing.ready || !billing.connected || !billing.webhookVerifierConfigured)
    throw new Error('Dispatcher deployed; scheduling remains disabled because QuickBooks payment verification failed.');
  const existing = google(['scheduler','jobs','list','--project',PROJECT,'--location',region,'--filter',`name:${name}`,'--format=value(name)']);
  const operation = existing ? 'update' : 'create';
  google(['scheduler','jobs',operation,'http',name,'--project',PROJECT,'--location',region,
    '--schedule','*/10 * * * *','--time-zone','Etc/UTC','--uri',`https://run.googleapis.com/v2/${BILLING_JOB}:run`,
    '--http-method','POST','--message-body','{}','--oauth-service-account-email',`elevate-billing-scheduler@${PROJECT}.iam.gserviceaccount.com`,
    '--oauth-token-scope','https://www.googleapis.com/auth/cloud-platform','--max-retry-attempts','0','--attempt-deadline','30s','--quiet']);
  const schedule = JSON.parse(google(['scheduler','jobs','describe',name,'--project',PROJECT,'--location',region,'--format=json']));
  if (schedule.state !== 'ENABLED' || schedule.schedule !== '*/10 * * * *' || schedule.httpTarget?.uri !== `https://run.googleapis.com/v2/${BILLING_JOB}:run` ||
      schedule.httpTarget?.oauthToken?.serviceAccountEmail !== `elevate-billing-scheduler@${PROJECT}.iam.gserviceaccount.com`)
    throw new Error('Google billing schedule readback mismatch');
  console.log(JSON.stringify({ googleJob: name, scheduler: 'verified', admin: ADMIN_URL, secret: 'scoped', paymentBoundary: 'verified', deliveryAcceptance: 'not_executed' }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
