import {pathToFileURL} from 'node:url';
import {appendFileSync} from 'node:fs';
import {google,loadGoogleConfig,PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';
import {modelCredential} from './deploy-owned-llm.mjs';

export const CPU_SERVICE='elevate-owned-cpu-llm';
export const CPU_REGION='us-east1';
// Share the production resource envelope with the fail-closed quota preflight.
export const CPU_CAPACITY=Object.freeze({cpu:'8',memory:'16Gi',maxInstances:3});
// The engine defaults to an additional 8 GiB prompt cache. That cannot fit
// alongside model weights and the active context in a 16 GiB container.
export const CPU_CACHE_ENV={LLAMA_ARG_CACHE_RAM:'0',LLAMA_ARG_CTX_CHECKPOINTS:'0'};
const MODEL_IDENTITY=`elevate-llm-runtime@${PROJECT}.iam.gserviceaccount.com`;
const DEPLOY_IDENTITY=`elevate-github-deploy@${PROJECT}.iam.gserviceaccount.com`;
const SECRET='elevate-owned-llm-token';
const fail=code=>{throw Error('PRIVATE_CPU_RELEASE_'+code);};

export function privateCpuDeploymentArguments(digest) {
  if(!/^sha256:[a-f0-9]{64}$/.test(digest))fail('IMMUTABLE_IMAGE_REQUIRED');
  // PARIS chat is user-facing: one instance stays warm. Scale-to-zero made the
  // first turn after any idle period fail — a cold 7B CPU model takes minutes
  // to load, while the live chat route gives up after 45s and the health probe
  // after 15s, so the apps reported the model "unavailable" even though it was
  // healthy (verified live 2026-11-23: workflow run #6 green, homepage/Admin
  // chat both falling back). One warm instance is an always-on 8 CPU / 16 GiB
  // cost; that is the price of a live PARIS, not a free default.
  // Owner resize (2026-11-27, Elizabeth: "make it big and fix it"): 4 CPU /
  // 8 GiB / concurrency 1 serialized every parallel platform call behind a
  // single 47-132s generation. The worker now runs two parallel 8192-token
  // slots on eight threads, so the service takes concurrency 2 per instance
  // and up to 3 instances; the per-request context contract is unchanged.
  return ['run','deploy',CPU_SERVICE,'--project',PROJECT,'--region',CPU_REGION,
    '--image',`us-central1-docker.pkg.dev/${PROJECT}/elevate/owned-cpu-llm@${digest}`,
    '--service-account',MODEL_IDENTITY,'--port','8080','--cpu',CPU_CAPACITY.cpu,'--memory',CPU_CAPACITY.memory,
    '--min','1','--min-instances','1','--max-instances',String(CPU_CAPACITY.maxInstances),'--concurrency','2','--timeout','300s','--cpu-boost',
    '--update-env-vars='+Object.entries(CPU_CACHE_ENV).map(([key,value])=>key+'='+value).join(','),
    '--startup-probe','httpGet.path=/health,httpGet.port=8080,periodSeconds=10,timeoutSeconds=5,failureThreshold=24',
    '--set-secrets',`LLM_WORKER_SECRET=${SECRET}:latest`,'--quiet'];
}

export function reviewPrivateModelPolicy(policy,adminIdentity) {
  if(!/^[a-z0-9-]+@elegant-racer-299721\.iam\.gserviceaccount\.com$/.test(adminIdentity??''))fail('ADMIN_IDENTITY_UNVERIFIED');
  if(policy.bindings?.some(binding=>binding.members?.some(member=>['allUsers','allAuthenticatedUsers'].includes(member))))fail('PUBLIC_ACCESS_FORBIDDEN');
  const invokers=policy.bindings?.filter(binding=>binding.role==='roles/run.invoker'&&!binding.condition).flatMap(binding=>binding.members??[])??[];
  const required=[DEPLOY_IDENTITY,adminIdentity];
  return {private:true,requiredInvokers:required,principalsWithoutServiceBinding:required.filter(identity=>!invokers.includes('serviceAccount:'+identity))};
}

export async function preflightPrivateCpuRelease({run=google,capacity=inspectRegionalCapacity}={}) {
  const config=loadGoogleConfig('admin',run);
  const token=modelCredential(config);
  run(['iam','service-accounts','describe',MODEL_IDENTITY,'--project',PROJECT,'--format=value(email)']);
  const policy=JSON.parse(run(['secrets','get-iam-policy',SECRET,'--project',PROJECT,'--format=json']));
  const admin=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--format=json']));
  const adminIdentity=admin.spec?.template?.spec?.serviceAccountName;
  reviewPrivateModelPolicy({bindings:[]},adminIdentity);
  for(const identity of [MODEL_IDENTITY,adminIdentity]) {
    if(!policy.bindings?.some(binding=>binding.role==='roles/secretmanager.secretAccessor'&&!binding.condition&&binding.members?.includes('serviceAccount:'+identity)))fail('EXISTING_SECRET_READER_REQUIRED');
  }
  if(run(['secrets','versions','access','latest','--secret',SECRET,'--project',PROJECT])!==token)fail('EXISTING_TOKEN_MISMATCH');
  // Retain all serving/tagged old revisions and active executions in the bound,
  // plus the full new revision envelope. This conservative overlap bound also
  // covers post-cutover demand; one candidate instance cannot prove capacity.
  const allocation=await capacity({region:CPU_REGION,task:{containers:[{resources:{limits:{cpu:CPU_CAPACITY.cpu,memory:CPU_CAPACITY.memory}}}]},taskCount:CPU_CAPACITY.maxInstances,run});
  if(!allocation.fits)fail('REGIONAL_CAPACITY_REQUIRED');
  return {region:CPU_REGION,adminIdentity,existingIdentityAndSecretVerified:true,capacity:allocation};
}

export async function deployPrivateCpuCandidate({digest,run=google,preflight=preflightPrivateCpuRelease}={}) {
  const ready=await preflight({run});
  // A new Cloud Run service is IAM-private by default. Never add allUsers,
  // disable invocation IAM, create credentials, or grant access automatically.
  run(privateCpuDeploymentArguments(digest));
  const resource=JSON.parse(run(['run','services','describe',CPU_SERVICE,'--project',PROJECT,'--region',CPU_REGION,'--format=json']));
  const base=resource.status?.url;
  if(!/^https:\/\/elevate-owned-cpu-llm-[a-z0-9.-]+\.run\.app$/.test(base??''))fail('SERVICE_URL_UNVERIFIED');
  const container=resource.spec?.template?.spec?.containers?.[0];
  const limits=container?.resources?.limits;
  if(resource.spec?.template?.spec?.serviceAccountName!==MODEL_IDENTITY || limits?.cpu!==CPU_CAPACITY.cpu || limits?.memory!==CPU_CAPACITY.memory || limits?.['nvidia.com/gpu'])fail('RESOURCE_READBACK_FAILED');
  const policy=JSON.parse(run(['run','services','get-iam-policy',CPU_SERVICE,'--project',PROJECT,'--region',CPU_REGION,'--format=json']));
  const invocation=reviewPrivateModelPolicy(policy,ready.adminIdentity);
  return {service:CPU_SERVICE,region:CPU_REGION,url:base,revision:resource.status?.latestReadyRevisionName,imageDigest:digest,...invocation,productionEndpointChanged:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const mode=process.env.CPU_RELEASE_MODE??'preflight';
  (mode==='deploy'?deployPrivateCpuCandidate({digest:process.env.CPU_IMAGE_DIGEST}):preflightPrivateCpuRelease()).then(report=>{
    console.log(JSON.stringify(report));
    if(report.url&&process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,'model_url='+report.url+'\n');
    if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\nPrivate CPU model release evidence:\n```json\n'+JSON.stringify(report,null,2)+'\n```\n');

  }).catch(error=>{console.error(JSON.stringify({operation:'private_cpu_release',code:error.message?.startsWith('PRIVATE_CPU_RELEASE_')?error.message:error.code||'preflight_failed'}));process.exitCode=1;});
}
