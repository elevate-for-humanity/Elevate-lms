import {pathToFileURL} from 'node:url';
const repository='elevate-for-humanity/Elevate-lms';
const targets={admin:['https://admin.elevateforhumanity.org','deploy-admin.yml'],marketing:['https://www.elevateforhumanity.org','deploy-google-marketing-trigger.yml'],lms:['https://app.elevateforhumanity.org','deploy-google-lms-trigger.yml'],store:['https://store.elevateforhumanity.org','deploy-google-store-runtime.yml']};
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
async function live(component,sha,request) {
  const response=await boundedRequest(targets[component][0]+'/api/health',{redirect:'error',cache:'no-store'},request,'HEALTH');
  const health=await response.json();
  if(!response.ok || health.service!==component || health.commit!==sha || health.ready!==true || health.healthy!==true || health.dependencies?.supabase?.ok!==true)throw Error('ACCEPTANCE_LIVE_REVISION_MISMATCH');
  return {component,commit:health.commit,revision:health.revision};
}
export async function dispatchAcceptance(env=process.env,request=fetch) {
  const {component,sha,runId,token}=identity(env);
  const evidence=await live(component,sha,request);
  await api('actions/workflows/registered-apprenticeship-e2e.yml/dispatches',token,request,{ref:'main',inputs:{deployed_sha:sha,deployment_run_id:runId,component}});
  if(component==='admin')await api('actions/workflows/verify-owned-voicemail-speech.yml/dispatches',token,request,{ref:'main'});
  if(component==='store')await api('actions/workflows/migrate-store-paypal-config.yml/dispatches',token,request,{ref:'main',inputs:{apply:'false',routing:'validate',store_sha:sha,deployment_run_id:runId}});
  return {...evidence,acceptanceDispatched:true,acceptancePassed:false};
}
export async function verifyAcceptance(env=process.env,request=fetch,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))) {
  const {component,sha,runId,token}=identity(env);
  for(let attempt=0;attempt<36;attempt++) {
    const source=await api('actions/runs/'+runId,token,request);
    if(source.head_sha!==sha || source.head_branch!=='main' || source.event!=='workflow_dispatch' || source.path?.split('@')[0]!=='.github/workflows/'+targets[component][1])throw Error('ACCEPTANCE_DEPLOYMENT_SOURCE_MISMATCH');
    if(source.status==='completed') {
      if(source.conclusion!=='success')throw Error('ACCEPTANCE_DEPLOYMENT_NOT_SUCCESSFUL');
      return {...await live(component,sha,request),deploymentRun:runId,sourceVerified:true};
    }
    await delay(5000);
  }
  throw Error('ACCEPTANCE_DEPLOYMENT_COMPLETION_TIMEOUT');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const work=process.argv[2]==='dispatch'?dispatchAcceptance:process.argv[2]==='verify'?verifyAcceptance:null;
  if(!work)throw Error('ACCEPTANCE_COMMAND_REQUIRED');
  work().then(evidence=>console.log(JSON.stringify(evidence))).catch(error=>{console.error(/^ACCEPTANCE_[A-Z_0-9]+$/.test(error.message)?error.message:'ACCEPTANCE_REQUEST_FAILED');process.exitCode=1;});
}
