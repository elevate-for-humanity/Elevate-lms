import {pathToFileURL} from 'node:url';
import {google,loadGoogleConfig,PROJECT,validateConfig} from './runtime-config.mjs';
import {modelCredential} from './deploy-owned-llm.mjs';
import {acceptOwnedCpuModel} from './accept-owned-cpu-model.mjs';
import {activateTestedRevision} from './activate-tested-public-revision.mjs';
import {probeServingAdminModel} from './probe-owned-cpu-admin.mjs';
import {CPU_SERVICE,CPU_REGION,reviewPrivateModelPolicy} from './deploy-owned-cpu-model.mjs';

const SECRET='elevate-admin-runtime-config';
export const REQUIRED_ADMIN_CPU_COMMIT='56f8e7f693d94048c550b32efca71dcf8be2eacc';
const fail=code=>{throw Error('PRIVATE_CPU_ACTIVATION_'+code);};

// Every user-facing surface runs on the same owned PARIS model. The learner
// (lms), marketing, and store services must receive the identical private-model
// connection the admin service has, otherwise they cannot reach the shared
// brain and silently fall back to canned text.
export const OWNED_MODEL_CONSUMERS=['lms','marketing','store'];
export const OWNED_MODEL_ENV_KEYS=['ELEVATE_LLM_URL','ELEVATE_LLM_CPU_URL','ELEVATE_LLM_GOOGLE_IAM','PARIS_INFERENCE_TIER','PARIS_GPU_ENABLED','AI_PROVIDER','AI_PROVIDER_ORDER','ELEVATE_LLM_TIMEOUT_MS','ELEVATE_LLM_CONTEXT_TOKENS','OWNED_MODEL_RUNTIME_CONFIG_PROVIDER'];
const OWNED_MODEL_TOKEN_SECRET='elevate-owned-llm-token';
const IDENTITY_RE=/^[a-z0-9-]+@elegant-racer-299721\.iam\.gserviceaccount\.com$/;

export function prepareOwnedModelConfiguration(config,component,base,token) {
 if(!/^https:\/\/elevate-owned-cpu-llm-[a-z0-9.-]+\.run\.app$/.test(base??''))fail('ENDPOINT_UNVERIFIED');
 if(typeof token!=='string'||token.length<24)fail('APPLICATION_SECRET_REQUIRED');
 return validateConfig({...config,runtimeEnvironment:{...config.runtimeEnvironment,
  ELEVATE_LLM_URL:base,ELEVATE_LLM_CPU_URL:base,ELEVATE_LLM_SECRET:token,ELEVATE_LLM_CPU_SECRET:token,
  ELEVATE_LLM_GOOGLE_IAM:'true',PARIS_INFERENCE_TIER:'cpu',PARIS_GPU_ENABLED:'false',
  AI_PROVIDER:'elevate',AI_PROVIDER_ORDER:'elevate',ELEVATE_LLM_TIMEOUT_MS:'300000',ELEVATE_LLM_CONTEXT_TOKENS:'8192',
  OWNED_MODEL_RUNTIME_CONFIG_PROVIDER:'google-secret-manager',
 }},component);
}

export function prepareAdminCpuConfiguration(config,base,token) {
 return prepareOwnedModelConfiguration(config,'admin',base,token);
}

function ensureOwnedModelSecretReader(run,member) {
 const policy=JSON.parse(run(['secrets','get-iam-policy',OWNED_MODEL_TOKEN_SECRET,'--project',PROJECT,'--format=json']));
 if(policy.bindings?.some(binding=>binding.role==='roles/secretmanager.secretAccessor'&&!binding.condition&&binding.members?.includes(member)))return;
 run(['secrets','add-iam-policy-binding',OWNED_MODEL_TOKEN_SECRET,'--project',PROJECT,`--member=${member}`,'--role=roles/secretmanager.secretAccessor','--condition=None','--quiet']);
}

/** Bind the shared owned model into a consumer service and grant it access.
 *  Best-effort per consumer: a grant that needs a project owner is reported,
 *  never allowed to abort the already-verified admin activation. */
export async function configureOwnedModelConsumers({base,token,run=google,components=OWNED_MODEL_CONSUMERS,region='us-central1',grantInvoker=true}={}) {
 const results=[];
 for(const component of components) {
  const service=`elevate-${component}-migration`;
  try {
   const original=loadGoogleConfig(component,run);
   const next=prepareOwnedModelConfiguration(original,component,base,token);
   const payload=JSON.stringify(next);
   const added=JSON.parse(run(['secrets','versions','add',`elevate-${component}-runtime-config`,'--project',PROJECT,'--data-file=-','--format=json'],payload));
   const version=added.name?.split('/').at(-1);
   if(!/^\d+$/.test(version??'')||run(['secrets','versions','access',version,'--secret',`elevate-${component}-runtime-config`,'--project',PROJECT])!==payload)
    {results.push({component,service,configured:false,code:'CONSUMER_CONFIGURATION_READBACK_FAILED'});continue;}
   const describe=JSON.parse(run(['run','services','describe',service,'--project',PROJECT,'--region',region,'--format=json']));
   const identity=describe.spec?.template?.spec?.serviceAccountName;
   if(!IDENTITY_RE.test(identity??'')){results.push({component,service,configured:false,code:'CONSUMER_IDENTITY_UNVERIFIED'});continue;}
   ensureOwnedModelSecretReader(run,`serviceAccount:${identity}`);
   run(['run','services','update',service,'--project',PROJECT,'--region',region,
    '--update-env-vars='+OWNED_MODEL_ENV_KEYS.map(key=>key+'='+next.runtimeEnvironment[key]).join(','),
    '--remove-env-vars=ELEVATE_LLM_SECRET,ELEVATE_LLM_CPU_SECRET',
    '--update-secrets=ELEVATE_LLM_SECRET='+OWNED_MODEL_TOKEN_SECRET+':latest,ELEVATE_LLM_CPU_SECRET='+OWNED_MODEL_TOKEN_SECRET+':latest','--quiet']);
   let invokerGranted=false;
   if(grantInvoker) {
    try {
     run(['run','services','add-iam-policy-binding',CPU_SERVICE,'--project',PROJECT,'--region',CPU_REGION,`--member=serviceAccount:${identity}`,'--role=roles/run.invoker','--condition=None','--quiet']);
     invokerGranted=true;
    } catch(error) { invokerGranted=false; }
   }
   results.push({component,service,identity,version,configured:true,invokerGranted});
  } catch(error) {
   results.push({component,service,configured:false,code:error.message?.startsWith('PRIVATE_CPU_ACTIVATION_')?error.message:(error.code||'consumer_configuration_failed')});
  }
 }
 return results;
}


export async function activatePrivateCpuModel({base,invokerToken,run=google,request=fetch,accept=acceptOwnedCpuModel,activate=activateTestedRevision,probeAdmin=probeServingAdminModel}={}) {
 const original=loadGoogleConfig('admin',run);
 const token=modelCredential(original);
 const modelService=JSON.parse(run(['run','services','describe',CPU_SERVICE,'--project',PROJECT,'--region',CPU_REGION,'--format=json']));
 if(modelService.status?.url!==base)fail('ENDPOINT_NOT_OWNED');
 const before=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--format=json']));
 const adminIdentity=before.spec?.template?.spec?.serviceAccountName;
 const policy=JSON.parse(run(['run','services','get-iam-policy',CPU_SERVICE,'--project',PROJECT,'--region',CPU_REGION,'--format=json']));
 reviewPrivateModelPolicy(policy,adminIdentity); // Private policy is required; effective permissions may be inherited.
 if(!invokerToken)fail('GOOGLE_INVOCATION_IDENTITY_REQUIRED');
 const health=await request(new URL('/api/health',before.status?.url),{redirect:'error',signal:AbortSignal.timeout(15000)});
 const body=await health.json();
 if(!health.ok||!body.healthy||body.service!=='admin'||!/^[a-f0-9]{40}$/.test(body.commit??''))fail('LIVE_ADMIN_UNVERIFIED');
 if(body.commit!==REQUIRED_ADMIN_CPU_COMMIT) {
  const compare=await request(`https://api.github.com/repos/elevate-for-humanity/Elevate-lms/compare/${REQUIRED_ADMIN_CPU_COMMIT}...${body.commit}`,{headers:{Accept:'application/vnd.github+json'},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!compare.ok||!['ahead','identical'].includes((await compare.json()).status))fail('PRIVATE_TRANSPORT_ADAPTER_NOT_LIVE');
 }
 const acceptance=await accept({base,token,invokerToken});
 if(acceptance?.passed!==true)fail('REAL_MODEL_ACCEPTANCE_REQUIRED');
 const adminInvocation=await probeAdmin({base,run});
 if(adminInvocation?.verified!==true)fail('ADMIN_INVOCATION_REQUIRED');
 const next=prepareAdminCpuConfiguration(original,base,token);
 if(JSON.stringify(loadGoogleConfig('admin',run))!==JSON.stringify(original))fail('CONFIGURATION_CHANGED_CONCURRENTLY');
 const previousVersion=run(['secrets','versions','list',SECRET,'--project',PROJECT,'--limit=1','--format=value(name)']);
 let written=false;
 let stagedRevision;
 try {
  const payload=JSON.stringify(next);
  const added=JSON.parse(run(['secrets','versions','add',SECRET,'--project',PROJECT,'--data-file=-','--format=json'],payload));
  written=true;
  const version=added.name?.split('/').at(-1);
  if(!/^\d+$/.test(version??'')||run(['secrets','versions','access',version,'--secret',SECRET,'--project',PROJECT])!==payload)fail('CONFIGURATION_READBACK_FAILED');
  // Keep the serving image, identity, resource limits and traffic unchanged
  // until the new binding revision passes the standard activation checks.
  run(['run','services','update','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--no-traffic',
   '--update-env-vars='+OWNED_MODEL_ENV_KEYS.map(key=>key+'='+next.runtimeEnvironment[key]).join(','),
   '--remove-env-vars=ELEVATE_LLM_SECRET,ELEVATE_LLM_CPU_SECRET',
   '--update-secrets=ELEVATE_LLM_SECRET=elevate-owned-llm-token:latest,ELEVATE_LLM_CPU_SECRET=elevate-owned-llm-token:latest','--quiet']);
  const after=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--format=json']));
  const revision=after.status?.latestCreatedRevisionName;
  stagedRevision=revision;
  if(!/^elevate-admin-migration-[a-z0-9-]+$/.test(revision??''))fail('ADMIN_CANDIDATE_UNVERIFIED');
  const activation=await activate({service:'elevate-admin-migration',revision,commit:body.commit,read:args=>JSON.parse(run([...args,'--project',PROJECT,'--format=json'])),fetcher:request});
  // Admin is verified and serving. Now give every other surface the same owned
  // model so the platform runs as one system instead of isolated services.
  const consumers=await configureOwnedModelConsumers({base,token,run});
  return {accepted:true,...acceptance,adminInvocation,modelUrl:base,adminCandidate:revision,configurationVersion:version,previousConfigurationVersion:previousVersion,previousAdminTraffic:before.status?.traffic,endpointAliasesUpdated:['ELEVATE_LLM_URL','ELEVATE_LLM_CPU_URL'],productionTrafficChanged:true,activation,consumers};
 } catch(error) {
  // Do not overwrite another writer's later configuration while rolling back.
  const current=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--format=json']));
  const traffic=(before.status?.traffic??[]).filter(item=>item.percent>0);
  if(written&&stagedRevision&&current.status?.latestCreatedRevisionName===stagedRevision&&current.status?.traffic?.some(item=>item.percent>0&&item.revisionName===stagedRevision)&&traffic.length&&traffic.every(item=>/^elevate-admin-migration-[a-z0-9-]+$/.test(item.revisionName??''))) {
    run(['run','services','update-traffic','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--to-revisions='+traffic.map(item=>item.revisionName+'='+item.percent).join(','),'--quiet']);
  }
  if(written&&JSON.stringify(loadGoogleConfig('admin',run))===JSON.stringify(next))run(['secrets','versions','add',SECRET,'--project',PROJECT,'--data-file=-'],JSON.stringify(original));
  throw error;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 activatePrivateCpuModel({base:process.env.CPU_MODEL_URL,invokerToken:process.env.MODEL_INVOKER_TOKEN}).then(report=>{
  console.log(JSON.stringify(report));

 }).catch(error=>{console.error(JSON.stringify({operation:'activate_private_cpu_model',code:error.message?.startsWith('PRIVATE_CPU_ACTIVATION_')?error.message:error.code||'activation_failed'}));process.exitCode=1;});
}
