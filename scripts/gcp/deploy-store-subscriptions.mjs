import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { google, PROJECT } from './runtime-config.mjs';
import { ADMIN_URL, STORE_URL, BILLING_JOB } from './run-store-subscriptions.mjs';
import { inspectRegionalCapacity } from './regional-capacity.mjs';
import { assertNoActiveExecutions } from './execute-course-job.mjs';

export async function preflightBillingRollout({run=google, capacityCheck=inspectRegionalCapacity}={}) {
  const scope=['--project',PROJECT,'--region','us-central1','--format=json'];
  const job=JSON.parse(run(['run','jobs','describe','elevate-store-subscriptions',...scope]));
  const task=job.spec?.template?.spec?.template?.spec;
  if(task?.serviceAccountName!==`elevate-billing-runtime@${PROJECT}.iam.gserviceaccount.com`)
    throw new Error('BILLING_EXISTING_IDENTITY_UNVERIFIED');
  const executions=()=>JSON.parse(run(['run','jobs','executions','list','--job=elevate-store-subscriptions',...scope]));
  assertNoActiveExecutions(executions());
  const capacity=await capacityCheck({region:'us-central1',task:{containers:[{resources:{limits:{cpu:'1',memory:'512Mi'}}}]},taskCount:1,run});
  if(capacity?.fits!==true)throw new Error('BILLING_REGIONAL_CAPACITY_UNAVAILABLE');
  assertNoActiveExecutions(executions());
  return {capacityVerified:true,activeExecutions:0};
}
export function dispatcherSource() {
  const source = readFileSync(new URL('./run-store-subscriptions.mjs', import.meta.url), 'utf8').replace(/^export /gm, '');
  if (source.includes('~')) throw new Error('Dispatcher argument delimiter collision');
  return source + '\nrunStoreSubscriptions().then(result => console.log(JSON.stringify(result))).catch(() => { console.error("Google billing dispatcher failed; inspect task status."); process.exitCode = 1; });';
}
export function billingDeploymentTarget(env) {
  const component = env.BILLING_RUNTIME_COMPONENT || 'admin';
  if (!['admin', 'store'].includes(component)) throw new Error('BILLING_COMPONENT_INVALID');
  const token = component === 'store' ? env.GOOGLE_STORE_TOKEN : env.GOOGLE_ADMIN_TOKEN;
  if (!token || (component === 'admin' && !env.GOOGLE_MARKETING_TOKEN)) throw new Error('BILLING_IDENTITY_REQUIRED');
  return { component, url: component === 'store' ? STORE_URL : ADMIN_URL, token,
    providerUrl: component === 'store' ? STORE_URL : 'https://elevate-marketing-migration-aabnh2y32a-uc.a.run.app',
    providerToken: component === 'store' ? token : env.GOOGLE_MARKETING_TOKEN };
}
export async function verifyBillingTarget(target, sha, request = fetch) {
  if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('BILLING_COMMIT_REQUIRED');
  for (const path of ['/api/ready', '/api/health']) {
    const response = await request(target.url + path, { headers: { 'X-Serverless-Authorization': 'Bearer ' + target.token }, redirect: 'error', signal: AbortSignal.timeout(30000) });
    const body = await response.json().catch(() => ({}));
    if (response.status !== 200 || body.service !== target.component || body.commit !== sha || body.ready !== true ||
      (path === '/api/health' && (body.healthy !== true || body.dependencies?.supabase?.ok !== true)))
      throw new Error('BILLING_RUNTIME_NOT_VERIFIED');
  }
  const response = await request(target.providerUrl + '/api/health/quickbooks', { headers: { 'X-Serverless-Authorization': 'Bearer ' + target.providerToken }, redirect: 'error', signal: AbortSignal.timeout(30000) });
  const billing = await response.json().catch(() => ({}));
  if (response.status !== 200 || !billing.ready || !billing.connected || !billing.webhookVerifierConfigured) throw new Error('BILLING_PROVIDER_NOT_VERIFIED');
}
async function main() {
  const sha = process.env.IMAGE_SHA;
  const target = billingDeploymentTarget(process.env);
  // Read-only acceptance must succeed before modifying the existing dispatcher.
  await verifyBillingTarget(target, sha);
  const name = 'elevate-store-subscriptions', region = 'us-central1';
  const image = `us-central1-docker.pkg.dev/${PROJECT}/elevate/${target.component}`;
  const digest = google(['artifacts','docker','images','describe',`${image}:${sha}`,'--project',PROJECT,'--format=value(image_summary.digest)']);
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error('Verified billing image digest required');
  // The administrator-created resource carries the confined IAM bindings.
  const source = dispatcherSource();
  await preflightBillingRollout();
  google(['run','jobs','deploy',name,'--project',PROJECT,'--region',region,'--image',`${image}@${digest}`,
    '--service-account',`elevate-billing-runtime@${PROJECT}.iam.gserviceaccount.com`,
    '--command','node','--args',`^~^--input-type=module~-e~${source}`,
    '--set-secrets','CRON_SECRET=elevate-billing-cron-secret:latest',
    '--set-env-vars',`BILLING_RUNTIME_COMPONENT=${target.component},EXPECTED_${target.component.toUpperCase()}_COMMIT=${sha}`,
    '--cpu','1','--memory','512Mi','--tasks','1','--parallelism','1','--max-retries','0','--task-timeout','600s','--quiet']);
  const job = JSON.parse(google(['run','jobs','describe',name,'--project',PROJECT,'--region',region,'--format=json']));
  const spec = job.spec?.template?.spec?.template?.spec;
  const container = spec?.containers?.[0];
  if (spec?.serviceAccountName !== `elevate-billing-runtime@${PROJECT}.iam.gserviceaccount.com` ||
      container?.image !== `${image}@${digest}` || container.args?.[2] !== source ||
      container.env?.find((item) => item.name === 'CRON_SECRET')?.valueFrom?.secretKeyRef?.name !== 'elevate-billing-cron-secret')
    throw new Error('Google billing dispatcher readback mismatch');
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
  console.log(JSON.stringify({ googleJob: name, scheduler: 'verified', component: target.component, runtime: target.url, secret: 'scoped', paymentBoundary: 'verified', deliveryAcceptance: 'not_executed' }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
