import {randomUUID} from 'node:crypto';
import {verifyStudioRuntimeReplacement} from './verify-studio-runtime-replacement.mjs';
import {inventoryStudioLiveState} from './inventory-studio-live-state.mjs';
import {verifyStudioWorkspacePreservation} from './verify-studio-workspace-preservation.mjs';
import {execFileSync, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir, writeFile} from 'node:fs/promises';
const execAsync=promisify(execFile);
async function collectStartupDiagnostics(){
  const folder='reports/studio-browser';await mkdir(folder,{recursive:true});
  let revision;
  try{const {stdout}=await execAsync('gcloud',['run','services','describe',name,'--project='+project,'--region='+region,'--format=value(status.latestCreatedRevisionName)'],{timeout:30000,maxBuffer:2*1024*1024});revision=stdout.trim();}
  catch{await writeFile(folder+'/startup.json',JSON.stringify({service:name,revision:null,reason:'No created revision could be read'}));return;}
  if(!revision){await writeFile(folder+'/startup.json',JSON.stringify({service:name,revision:null,reason:'Service has no created revision'}));return;}
  const requests=[
    ['revision.json',['run','revisions','describe',revision,'--project='+project,'--region='+region,'--format=json']],
    ['container-logs.json',['logging','read','resource.type="cloud_run_revision" AND resource.labels.service_name="'+name+'" AND resource.labels.revision_name="'+revision+'"','--project='+project,'--limit=40','--freshness=2h','--format=json']],
  ];
  await Promise.all(requests.map(async([file,args])=>{try{const {stdout}=await execAsync('gcloud',args,{timeout:30000,maxBuffer:2*1024*1024});const raw=JSON.parse(stdout);
      const selected=file==='revision.json'?{name:raw.metadata?.name,containers:(raw.spec?.containers||[]).map(c=>({image:c.image,resources:c.resources,ports:c.ports})),conditions:(raw.status?.conditions||[]).map(c=>({type:c.type,status:c.status,reason:c.reason}))}:(Array.isArray(raw)?raw:[]).map(e=>({timestamp:e.timestamp,severity:e.severity,logName:e.logName}));
      await writeFile(folder+'/'+file,JSON.stringify(selected));}catch{await writeFile(folder+'/'+file,JSON.stringify({service:name,revision,diagnostic:'Unavailable within 30 second deadline'}));}}));
  console.error(JSON.stringify({service:name,failedRevision:revision,diagnostics:folder,adminSwitched:false}));
}
const project='elegant-racer-299721',region='us-central1',name='elevate-studio-browser';
const identity='elevate-studio-runtime@'+project+'.iam.gserviceaccount.com';
const bucket=project+'-studio-browser-auth',secretName='studio-browser-shared-secret';
function command(args,input){return execFileSync('gcloud',args,{encoding:'utf8',input,timeout:900000,stdio:['pipe','pipe','pipe']}).trim();}
function gc(args){return command([...args,'--project='+project,'--format=json']);}
const existingService=JSON.parse(gc(['run','services','describe',name,'--region='+region]));
// Routine releases use only the owner's existing canonical secret and bucket.
// The workflow verifies the prepared identity/bindings before any image build.
const secret=command(['secrets','versions','access','latest','--secret='+secretName,'--project='+project]);
if(!secret||secret.length<16)throw Error('Existing Studio secret unavailable; refusing credential rotation');
if(!/^https:\/\/[a-z0-9.-]+\.run\.app$/.test(existingService.status?.url||''))throw Error('Verified existing Studio URL required');
const canonicalProof=await fetch(existingService.status.url+'/workspace/files',{headers:{'x-studio-browser-secret':secret},redirect:'error',signal:AbortSignal.timeout(20000)});
if(!canonicalProof.ok)throw Error('Existing Studio rejected its canonical key; refusing credential rotation');
const bucketState=JSON.parse(gc(['storage','buckets','describe','gs://'+bucket]));
if(![bucket,'gs://'+bucket,'gs://'+bucket+'/'].includes(bucketState.name||bucketState.id))throw Error('Owner-prepared Studio bucket is unverified; no storage was created');
const sha=process.env.IMAGE_SHA;if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Immutable image SHA required');
const image='us-central1-docker.pkg.dev/'+project+'/elevate/studio-browser';
const digest=command(['artifacts','docker','images','describe',image+':'+sha,'--project='+project,'--format=value(image_summary.digest)']);
if(!/^sha256:[a-f0-9]{64}$/.test(digest))throw Error('Image digest unavailable');
const existingBrowser=existingService.spec?.template?.spec;
const previousTraffic=(existingService.status?.traffic||[]).filter(t=>t.percent>0&&t.revisionName).map(t=>t.revisionName+'='+t.percent).join(',');
const authMount=existingBrowser?.containers?.[0]?.volumeMounts?.find(m=>m.mountPath==='/var/lib/studio-browser-auth');
const activeVolume=existingBrowser?.volumes?.find(v=>v.name===authMount?.name);
if(authMount&&activeVolume?.csi?.volumeAttributes?.bucketName!==bucket)throw Error('Existing browser auth mount points to an unverified bucket');
const mounted=new Set((existingBrowser?.containers||[]).flatMap(c=>(c.volumeMounts||[]).map(m=>m.name)));
const staleVolumes=(existingBrowser?.volumes||[]).filter(v=>!mounted.has(v.name)&&v.csi?.driver==='gcsfuse.run.googleapis.com'&&v.csi?.volumeAttributes?.bucketName===bucket).map(v=>v.name);
const mountArguments=authMount?[]:['--add-volume=name=elevate-studio-browser-auth,mount-path=/var/lib/studio-browser-auth,type=cloud-storage,bucket='+bucket+',mount-options=uid=1001;gid=1001;file-mode=600;dir-mode=700'];
if(staleVolumes.length)mountArguments.push('--remove-volume='+staleVolumes.join(','));
// A verification run must never claim a tag used by an active Admin connection.
// Cloud Run limits service name plus traffic tag to 46 characters.
const candidateTag='sc-'+sha.slice(0,8)+'-'+randomUUID().slice(0,8);
if(candidateTag.length+name.length>46)throw Error('STUDIO_CANDIDATE_TAG_TOO_LONG');
if((existingService.status?.traffic||[]).some(t=>t.tag===candidateTag))throw Error('STUDIO_CANDIDATE_TAG_COLLISION');
let url,state,candidateRevision,trafficActivated=false;
try {
command(['run','deploy',name,'--project='+project,'--region='+region,'--image='+image+'@'+digest,'--service-account='+identity,'--port=3100','--cpu=2','--memory=4Gi','--min-instances=1','--max-instances=1','--concurrency=20','--no-cpu-throttling','--timeout=3600','--execution-environment=gen2','--allow-unauthenticated','--no-traffic','--tag='+candidateTag,'--update-env-vars=STUDIO_BROWSER_AUTH_STATE_DIR=/var/lib/studio-browser-auth,STUDIO_BROWSER_ADMIN_ORIGIN=https://admin.elevateforhumanity.org,GIT_SHA='+sha,'--update-secrets=STUDIO_BROWSER_SECRET='+secretName+':latest',...mountArguments,'--startup-probe=httpGet.path=/health,httpGet.port=3100,initialDelaySeconds=5,periodSeconds=10,timeoutSeconds=5,failureThreshold=24','--liveness-probe=httpGet.path=/live,httpGet.port=3100,periodSeconds=30,timeoutSeconds=5,failureThreshold=3','--quiet']);
const service=JSON.parse(gc(['run','services','describe',name,'--region='+region]));
url=service.status.url;
candidateRevision=service.status.latestCreatedRevisionName;
const candidate=service.status.traffic?.find(t=>t.tag===candidateTag&&t.revisionName===candidateRevision);
if(!candidate?.url||!candidateRevision)throw Error('Exact browser candidate URL unavailable; traffic was not changed');
// The new Cloud Run revision can briefly serve an HTML Google Frontend error
// during startup. Never parse an unverified response as JSON or switch Admin
// until the exact deployed revision proves its readiness and persistence.
async function readHealth(base){
  const response=await fetch(base+'/health',{redirect:'manual',signal:AbortSignal.timeout(20000)});
  const type=response.headers.get('content-type')||'';
  if(!response.ok || type.split(';')[0].trim().toLowerCase()!=='application/json'){
    throw new Error('Studio health endpoint returned HTTP '+response.status+
      ' with content-type '+(type.split(';')[0]||'missing')+
      '; expected 200 application/json (Admin not switched)');
  }
  let body;
  try{body=await response.json();}
  catch{throw new Error('Studio health endpoint returned invalid JSON (Admin not switched)');}
  if(!body||typeof body!=='object')throw new Error('Studio health endpoint returned invalid readiness data');
  return body;
}
async function verifyHealth(base,message){
  let healthError;
  for(let attempt=0;attempt<12;attempt++){
    try{
      const health=await readHealth(base);
      if(health.commit!==sha||!health.ready||!health.providerAuthStorage?.persistent)
        throw new Error(message);
      return health;
    }catch(error){
      healthError=error;
      if(attempt<11)await new Promise(resolve=>setTimeout(resolve,5000));
    }
  }
  throw healthError;
}
state=await verifyHealth(candidate.url,'Browser revision or durable encrypted auth storage not ready');
const unauthorized=await fetch(candidate.url+'/workspace/files',{signal:AbortSignal.timeout(20000)});
if(unauthorized.status!==401)throw Error('Browser service authorization boundary failed; Admin was not switched');
const authorized=await fetch(candidate.url+'/workspace/files',{headers:{'x-studio-browser-secret':secret},signal:AbortSignal.timeout(20000)});
if(!authorized.ok)throw Error('Authenticated workspace proof failed; Admin was not switched');
const foundationResponse=await fetch(candidate.url+'/foundation-test',{method:'POST',headers:{'x-studio-browser-secret':secret},redirect:'error',signal:AbortSignal.timeout(120000)});
if(!foundationResponse.ok)throw Error('Live candidate browser foundation failed; serving traffic retained');
const foundation=await foundationResponse.json();
if(foundation.passed!==true||foundation.commit!==sha||!Array.isArray(foundation.checks)||!foundation.checks.length||foundation.checks.some(check=>check.passed!==true))throw Error('Live candidate browser foundation evidence invalid; serving traffic retained');
console.log(JSON.stringify({candidateRevision,commit:sha,browserFoundationPassed:true,checks:foundation.checks.map(check=>({name:check.name,passed:check.passed}))}));
const replacement=await verifyStudioRuntimeReplacement({url:candidate.url,revision:candidateRevision,sha,candidateTag,secret,readTraffic:async()=>JSON.parse(gc(['run','services','describe',name,'--region='+region])).status?.traffic});
if(replacement?.passed!==true||replacement.runtimeReplaced!==true||replacement.isolatedWorkspaceFileRestored!==true)throw Error('STUDIO_RUNTIME_REPLACEMENT_UNVERIFIED');
console.log(JSON.stringify(replacement));
if(process.env.STUDIO_CANDIDATE_ONLY==='true'){
  console.log(JSON.stringify({service:name,candidateRevision,candidateUrl:candidate.url,commit:sha,ready:state.ready,persistent:state.providerAuthStorage.persistent,candidateOnly:true,trafficChanged:false,adminSwitched:false}));
  // Keep the known-good serving revision and all its sessions untouched.
} else {
const live=await inventoryStudioLiveState({run:command});
if(live.activeBrowserSessions!==0||live.workspace.symlinks!==0||live.directChildShells!==0||live.directNonBrowserProcesses!==0||live.processInventoryReadable!==true||!Number.isSafeInteger(live.workspace.files)||live.workspace.files<0)throw Error('STUDIO_LIVE_STATE_REQUIRES_PRESERVATION');
if(live.workspace.files>0){
  const preservation=await verifyStudioWorkspacePreservation({sourceUrl:url,candidateUrl:candidate.url,secret,expectedFiles:live.workspace.files});
  if(preservation?.passed!==true||preservation.files!==live.workspace.files)throw Error('STUDIO_LIVE_STATE_REQUIRES_PRESERVATION');
  const current=await inventoryStudioLiveState({run:command});
  if(current.commit!==live.commit||current.activeBrowserSessions!==0||current.workspace.files!==live.workspace.files||current.workspace.symlinks!==0||current.directChildShells!==0||current.directNonBrowserProcesses!==0||current.processInventoryReadable!==true)throw Error('STUDIO_LIVE_STATE_REQUIRES_PRESERVATION');
  console.log(JSON.stringify({candidateRevision,workspacePreservation:preservation}));
}
command(['run','services','update-traffic',name,'--project='+project,'--region='+region,'--to-revisions='+candidateRevision+'=100','--quiet']);
trafficActivated=true;
state=await verifyHealth(url,'Public browser did not serve the verified candidate');
}
} catch(error) {
  if(trafficActivated&&previousTraffic){
    try{command(['run','services','update-traffic',name,'--project='+project,'--region='+region,'--to-revisions='+previousTraffic,'--quiet']);}
    catch{console.error('Browser traffic rollback failed; inspect preserved revision diagnostics');}
  }
  await collectStartupDiagnostics(secret);
  throw new Error(String(error.message).split(secret).join('[REDACTED]'));
} finally {
  // A verification tag keeps min=1 warm. Release only this exact candidate's
  // tag after acceptance/failure, retaining its revision and the old traffic.
  if(process.env.STUDIO_CANDIDATE_ONLY==='true'&&candidateRevision){
    try {
      const current=JSON.parse(gc(['run','services','describe',name,'--region='+region]));
      if(current.status?.traffic?.some(t=>t.tag===candidateTag&&t.revisionName===candidateRevision))
        command(['run','services','update-traffic',name,'--project='+project,'--region='+region,'--remove-tags='+candidateTag,'--quiet']);
      console.log(JSON.stringify({candidateRevision,candidateTagReleased:true,revisionRetained:true,servingTrafficChanged:false}));
    } catch {throw Error('STUDIO_CANDIDATE_TAG_CLEANUP_UNVERIFIED');}
  }
}
if(process.env.STUDIO_CANDIDATE_ONLY!=='true'){
command(['run','services','update','elevate-admin-migration','--project='+project,'--region='+region,'--update-env-vars=STUDIO_BROWSER_URL='+url+',STUDIO_BROWSER_PUBLIC_URL='+url,'--quiet']);
console.log(JSON.stringify({service:name,url,commit:sha,ready:state.ready,persistent:state.providerAuthStorage.persistent,authorizedWorkspace:true,anonymousWorkspaceDenied:true,adminSwitched:true,oldProviderRemoved:false,existingProviderLoginRecovery:'not verified'}));

}
