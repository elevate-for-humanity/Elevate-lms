import {pathToFileURL} from 'node:url';
const repository='elevate-for-humanity/Elevate-lms';
const targets={admin:['https://admin.elevateforhumanity.org','deploy-admin.yml'],marketing:['https://www.elevateforhumanity.org','deploy-google-marketing-trigger.yml'],lms:['https://app.elevateforhumanity.org','deploy-google-lms-trigger.yml'],store:['https://store.elevateforhumanity.org','deploy-google-store-runtime.yml']};
// Live health is retried across a ~60s window: a fresh revision can take
// seconds to propagate, and Cloud Run can answer 503 while a new revision
// starts. Three attempts 20s apart keep a good release from failing the gate
// on a transient stale revision without waiting indefinitely.
const liveAttempts=3,liveRetryDelayMs=20000;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function identity(env) {
  const component=env.ACCEPTANCE_COMPONENT,sha=env.ACCEPTANCE_SHA,runId=env.ACCEPTANCE_RUN_ID,token=env.GH_TOKEN;
  if(env.GITHUB_REPOSITORY!==repository || !targets[component] || !/^[a-f0-9]{40}$/.test(sha||'') || !/^[1-9]\d*$/.test(runId||'') || !token?.trim())throw Error('ACCEPTANCE_IDENTITY_REQUIRED');
  return {component,sha,runId,token};
}
async function boundedRequest(url,options,request,stage) {
  // GETs are safe to repeat after transport failures. Never retry a dispatch:
  // a lost response may mean GitHub already accepted that POST.
  const attempts=options.method==='POST'?1:3;
  for(let attempt=0;attempt<attempts;attempt++) {
    try {return await request(url,{...options,signal:AbortSignal.timeout(20000)});}
    catch(error) {
      const transient=['TimeoutError','AbortError','TypeError'].includes(error?.name);
      if(!transient || attempt===attempts-1)throw Error(`ACCEPTANCE_${stage}_${transient?'TRANSPORT_FAILED':'REQUEST_FAILED'}`);
    }
  }
}
async function api(path,token,request,body) {
  const response=await boundedRequest(`https://api.github.com/repos/${repository}/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error'},request,body?'DISPATCH':'SOURCE');
  if(!response.ok)throw Error('ACCEPTANCE_GITHUB_HTTP_'+response.status);
  return response.status===204?null:response.json();
}
// Only the fields needed to tell a stale revision from an unhealthy service.
// Commit SHAs are the deployed source identity, not secrets; no token, URL,
// header, or response body is ever included here.
function liveDiagnostics(status,health,sha) {
  return {status:status??null,service:typeof health?.service==='string'?health.service:null,expectedCommit:sha,returnedCommit:typeof health?.commit==='string'?health.commit:null,ready:health?.ready??null,healthy:health?.healthy??null,supabaseOk:health?.dependencies?.supabase?.ok??null};
}
async function live(component,sha,request,delay=sleep) {
  let diagnostics=null;
  for(let attempt=0;attempt<liveAttempts;attempt++) {
    // Transport failures are already retried inside boundedRequest and
    // propagate here unchanged; only error/mismatched responses are retried.
    const response=await boundedRequest(targets[component][0]+'/api/health',{redirect:'error',cache:'no-store'},request,'HEALTH');
    let health=null;
    try {health=await response.json();}
    catch {health=null;}
    diagnostics=liveDiagnostics(response.status,health,sha);
    if(response.ok && health?.service===component && health.commit===sha && health.ready===true && health.healthy===true && health.dependencies?.supabase?.ok===true)return {component,commit:health.commit,revision:health.revision};
    if(attempt<liveAttempts-1)await delay(liveRetryDelayMs);
  }
  const error=new Error(`ACCEPTANCE_LIVE_REVISION_MISMATCH ${JSON.stringify(diagnostics)}`);
  error.diagnostics=diagnostics;
  throw error;
}
export async function dispatchAcceptance(env=process.env,request=fetch,delay=sleep) {
  const {component,sha,runId,token}=identity(env);
  const evidence=await live(component,sha,request,delay);
  await api('actions/workflows/registered-apprenticeship-e2e.yml/dispatches',token,request,{ref:'main',inputs:{deployed_sha:sha,deployment_run_id:runId,component}});
  if(component==='lms')await api('actions/workflows/host-shop-cross-shop-acceptance.yml/dispatches',token,request,{ref:'main',inputs:{deployed_sha:sha,deployment_run_id:runId}});
  if(component==='admin')await api('actions/workflows/verify-owned-voicemail-speech.yml/dispatches',token,request,{ref:'main'});
  if(component==='store')await api('actions/workflows/migrate-store-paypal-config.yml/dispatches',token,request,{ref:'main',inputs:{apply:'false',routing:'validate',store_sha:sha,deployment_run_id:runId}});
  return {...evidence,acceptanceDispatched:true,acceptancePassed:false};
}
export async function verifyAcceptance(env=process.env,request=fetch,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))) {
  const {component,sha,runId,token}=identity(env);
  // GitHub can queue the final source-release confirmation after the LMS is live.
  // Bound the wait to 20 minutes; never accept an incomplete/failed source run.
  for(let attempt=0;attempt<240;attempt++) {
    const source=await api('actions/runs/'+runId,token,request);
    if(source.head_sha!==sha || source.head_branch!=='main' || source.event!=='workflow_dispatch' || source.path?.split('@')[0]!=='.github/workflows/'+targets[component][1])throw Error('ACCEPTANCE_DEPLOYMENT_SOURCE_MISMATCH');
    if(source.status==='completed') {
      if(source.conclusion!=='success')throw Error('ACCEPTANCE_DEPLOYMENT_NOT_SUCCESSFUL');
      return {...await live(component,sha,request,delay),deploymentRun:runId,sourceVerified:true};
    }
    await delay(5000);
  }
  throw Error('ACCEPTANCE_DEPLOYMENT_COMPLETION_TIMEOUT');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const work=process.argv[2]==='dispatch'?dispatchAcceptance:process.argv[2]==='verify'?verifyAcceptance:null;
  if(!work)throw Error('ACCEPTANCE_COMMAND_REQUIRED');
  work().then(evidence=>console.log(JSON.stringify(evidence))).catch(error=>{console.error(/^ACCEPTANCE_[A-Z_0-9]+(\s.*)?$/.test(error.message)?error.message:'ACCEPTANCE_REQUEST_FAILED');process.exitCode=1;});
}
