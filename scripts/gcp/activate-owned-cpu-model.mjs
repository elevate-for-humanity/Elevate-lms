import {pathToFileURL} from 'node:url';
import {google,loadGoogleConfig,PROJECT,validateConfig} from './runtime-config.mjs';
import {modelCredential} from './deploy-owned-llm.mjs';
import {acceptOwnedCpuModel} from './accept-owned-cpu-model.mjs';
import {activateTestedRevision} from './activate-tested-public-revision.mjs';
import {CPU_SERVICE,CPU_REGION,reviewPrivateModelPolicy} from './deploy-owned-cpu-model.mjs';

const SECRET='elevate-admin-runtime-config';
const ADAPTER_COMMIT='4e79ac553bf2c698167655bcbc9c287b38d82cb4';
const fail=code=>{throw Error('PRIVATE_CPU_ACTIVATION_'+code);};

export function prepareAdminCpuConfiguration(config,base,token) {
 if(!/^https:\/\/elevate-owned-cpu-llm-[a-z0-9.-]+\.run\.app$/.test(base??''))fail('ENDPOINT_UNVERIFIED');
 if(typeof token!=='string'||token.length<24)fail('APPLICATION_SECRET_REQUIRED');
 return validateConfig({...config,runtimeEnvironment:{...config.runtimeEnvironment,
  ELEVATE_LLM_URL:base,ELEVATE_LLM_CPU_URL:base,ELEVATE_LLM_SECRET:token,ELEVATE_LLM_CPU_SECRET:token,
  ELEVATE_LLM_GOOGLE_IAM:'true',PARIS_INFERENCE_TIER:'cpu',PARIS_GPU_ENABLED:'false',
  AI_PROVIDER:'elevate',AI_PROVIDER_ORDER:'elevate',ELEVATE_LLM_TIMEOUT_MS:'300000',
 }},'admin');
}

export async function activatePrivateCpuModel({base,invokerToken,run=google,request=fetch,accept=acceptOwnedCpuModel,activate=activateTestedRevision}={}) {
 const original=loadGoogleConfig('admin',run);
 const token=modelCredential(original);
 const before=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--format=json']));
 const adminIdentity=before.spec?.template?.spec?.serviceAccountName;
 const policy=JSON.parse(run(['run','services','get-iam-policy',CPU_SERVICE,'--project',PROJECT,'--region',CPU_REGION,'--format=json']));
 if(reviewPrivateModelPolicy(policy,adminIdentity).missingInvokers.length)fail('INVOCATION_REVIEW_REQUIRED');
 if(!invokerToken)fail('GOOGLE_INVOCATION_IDENTITY_REQUIRED');
 const health=await request(new URL('/api/health',before.status?.url),{redirect:'error',signal:AbortSignal.timeout(15000)});
 const body=await health.json();
 if(!health.ok||!body.healthy||body.service!=='admin'||!/^[a-f0-9]{40}$/.test(body.commit??''))fail('LIVE_ADMIN_UNVERIFIED');
 if(body.commit!==ADAPTER_COMMIT) {
  const compare=await request(`https://api.github.com/repos/elevate-for-humanity/Elevate-lms/compare/${ADAPTER_COMMIT}...${body.commit}`,{headers:{Accept:'application/vnd.github+json'},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!compare.ok||!['ahead','identical'].includes((await compare.json()).status))fail('PRIVATE_TRANSPORT_ADAPTER_NOT_LIVE');
 }
 const acceptance=await accept({base,token,invokerToken});
 if(acceptance?.passed!==true)fail('REAL_MODEL_ACCEPTANCE_REQUIRED');
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
   '--update-env-vars='+Object.entries(next.runtimeEnvironment).filter(([key])=>['ELEVATE_LLM_URL','ELEVATE_LLM_CPU_URL','ELEVATE_LLM_GOOGLE_IAM','PARIS_INFERENCE_TIER','PARIS_GPU_ENABLED','AI_PROVIDER','AI_PROVIDER_ORDER','ELEVATE_LLM_TIMEOUT_MS'].includes(key)).map(([key,value])=>key+'='+value).join(','),
   '--remove-env-vars=ELEVATE_LLM_SECRET,ELEVATE_LLM_CPU_SECRET',
   '--update-secrets=ELEVATE_LLM_SECRET=elevate-owned-llm-token:latest,ELEVATE_LLM_CPU_SECRET=elevate-owned-llm-token:latest','--quiet']);
  const after=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project',PROJECT,'--region','us-central1','--format=json']));
  const revision=after.status?.latestCreatedRevisionName;
  stagedRevision=revision;
  if(!/^elevate-admin-migration-[a-z0-9-]+$/.test(revision??''))fail('ADMIN_CANDIDATE_UNVERIFIED');
  const activation=await activate({service:'elevate-admin-migration',revision,commit:body.commit,read:args=>JSON.parse(run([...args,'--project',PROJECT,'--format=json'])),fetcher:request});
  return {accepted:true,...acceptance,modelUrl:base,adminCandidate:revision,configurationVersion:version,previousConfigurationVersion:previousVersion,previousAdminTraffic:before.status?.traffic,endpointAliasesUpdated:['ELEVATE_LLM_URL','ELEVATE_LLM_CPU_URL'],productionTrafficChanged:true,activation};
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
