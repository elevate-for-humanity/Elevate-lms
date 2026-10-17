import {execFileSync, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir, writeFile} from 'node:fs/promises';
const execAsync=promisify(execFile);
async function collectStartupDiagnostics(sharedSecret){
  const folder='reports/studio-browser';await mkdir(folder,{recursive:true});
  const redact=value=>String(value).split(sharedSecret).join('[REDACTED]');
  let revision;
  try{const {stdout}=await execAsync('gcloud',['run','services','describe',name,'--project='+project,'--region='+region,'--format=value(status.latestCreatedRevisionName)'],{timeout:30000,maxBuffer:2*1024*1024});revision=stdout.trim();}
  catch{await writeFile(folder+'/startup.json',JSON.stringify({service:name,revision:null,reason:'No created revision could be read'}));return;}
  if(!revision){await writeFile(folder+'/startup.json',JSON.stringify({service:name,revision:null,reason:'Service has no created revision'}));return;}
  const requests=[
    ['revision.json',['run','revisions','describe',revision,'--project='+project,'--region='+region,'--format=json']],
    ['container-logs.json',['logging','read','resource.type="cloud_run_revision" AND resource.labels.service_name="'+name+'" AND resource.labels.revision_name="'+revision+'"','--project='+project,'--limit=40','--freshness=2h','--format=json']],
  ];
  await Promise.all(requests.map(async([file,args])=>{try{const {stdout}=await execAsync('gcloud',args,{timeout:30000,maxBuffer:2*1024*1024});await writeFile(folder+'/'+file,redact(stdout));}catch{await writeFile(folder+'/'+file,JSON.stringify({service:name,revision,diagnostic:'Unavailable within 30 second deadline'}));}}));
  console.error(JSON.stringify({service:name,failedRevision:revision,diagnostics:folder,adminSwitched:false}));
}
const project='elegant-racer-299721',region='us-central1',name='elevate-studio-browser';
const identity='elevate-studio-runtime@'+project+'.iam.gserviceaccount.com';
const bucket=project+'-studio-browser-auth',secretName='studio-browser-shared-secret';
function command(args,input){return execFileSync('gcloud',args,{encoding:'utf8',input,timeout:900000,stdio:['pipe','pipe','pipe']}).trim();}
function gc(args){return command([...args,'--project='+project,'--format=json']);}
const existingService=JSON.parse(gc(['run','services','describe',name,'--region='+region]));
const existing=JSON.parse(gc(['secrets','list','--filter=name:'+secretName]));
const browserVariable=existingService.spec?.template?.spec?.containers?.[0]?.env?.find(x=>x.name==='STUDIO_BROWSER_SECRET');
const browserRef=browserVariable?.valueFrom?.secretKeyRef;
let secret;
if(existing.length && browserRef?.name===secretName) {
  // The migrated browser owns its canonical encryption secret. Prove that the
  // running server accepts that same key before releasing without Admin reads.
  secret=command(['secrets','versions','access',browserRef.key||'latest','--secret='+secretName,'--project='+project]);
  const latest=command(['secrets','versions','access','latest','--secret='+secretName,'--project='+project]);
  if(secret!==latest)throw Error('Studio secret mismatch; refusing credential rotation');
  if(!/^https:\/\/[a-z0-9.-]+\.run\.app$/.test(existingService.status?.url||''))throw Error('Verified existing Studio URL required');
  const proof=await fetch(existingService.status.url+'/workspace/files',{headers:{'x-studio-browser-secret':secret},redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!proof.ok)throw Error('Existing Studio rejected its canonical key; refusing credential rotation');
} else {
  // Bootstrap only: retain the old binding until canonical ownership is proven.
  const admin=JSON.parse(gc(['run','services','describe','elevate-admin-migration','--region='+region]));
  const variable=admin.spec.template.spec.containers[0].env.find(x=>x.name==='STUDIO_BROWSER_SECRET');
  secret=variable?.value;
  if(!secret && variable?.valueFrom?.secretKeyRef){const ref=variable.valueFrom.secretKeyRef;secret=command(['secrets','versions','access',ref.key||'latest','--secret='+ref.name,'--project='+project]);}
}
if(!secret || secret.length<16)throw Error('Existing Studio secret unavailable; refusing unauthenticated deployment or credential rotation');
if(!existing.length)command(['secrets','create',secretName,'--replication-policy=automatic','--project='+project]);
// Scope the deployment reader to this secret, so later releases can verify the
// existing encryption key without project-wide secret access or key rotation.
command(['secrets','add-iam-policy-binding',secretName,'--member=serviceAccount:elevate-github-deploy@'+project+'.iam.gserviceaccount.com','--role=roles/secretmanager.secretAccessor','--project='+project,'--quiet']);
if(!existing.length)command(['secrets','versions','add',secretName,'--data-file=-','--project='+project],secret);
else if(command(['secrets','versions','access','latest','--secret='+secretName,'--project='+project])!==secret)throw Error('Studio secret mismatch; refusing credential rotation');
command(['secrets','add-iam-policy-binding',secretName,'--member=serviceAccount:'+identity,'--role=roles/secretmanager.secretAccessor','--project='+project,'--quiet']);
const buckets=JSON.parse(gc(['storage','buckets','list','--filter=name:'+bucket]));
if(!buckets.length)command(['storage','buckets','create','gs://'+bucket,'--location='+region,'--uniform-bucket-level-access','--public-access-prevention','--project='+project]);
command(['storage','buckets','add-iam-policy-binding','gs://'+bucket,'--member=serviceAccount:'+identity,'--role=roles/storage.objectUser','--quiet']);
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
const candidateTag='studio-verify';
let url,state,candidateRevision,trafficActivated=false;
try {
command(['run','deploy',name,'--project='+project,'--region='+region,'--image='+image+'@'+digest,'--service-account='+identity,'--port=3100','--cpu=2','--memory=4Gi','--min-instances=1','--max-instances=1','--concurrency=20','--no-cpu-throttling','--timeout=3600','--execution-environment=gen2','--allow-unauthenticated','--no-traffic','--tag='+candidateTag,'--update-env-vars=STUDIO_BROWSER_AUTH_STATE_DIR=/var/lib/studio-browser-auth,STUDIO_BROWSER_ADMIN_ORIGIN=https://admin.elevateforhumanity.org','--update-secrets=STUDIO_BROWSER_SECRET='+secretName+':latest',...mountArguments,'--startup-probe=httpGet.path=/health,httpGet.port=3100,initialDelaySeconds=5,periodSeconds=10,timeoutSeconds=5,failureThreshold=24','--liveness-probe=httpGet.path=/health,httpGet.port=3100,periodSeconds=30,timeoutSeconds=5,failureThreshold=3','--quiet']);
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
if(process.env.STUDIO_CANDIDATE_ONLY==='true'){
  console.log(JSON.stringify({service:name,candidateRevision,candidateUrl:candidate.url,commit:sha,ready:state.ready,persistent:state.providerAuthStorage.persistent,candidateOnly:true,trafficChanged:false,adminSwitched:false}));
  // Keep the known-good serving revision and all its sessions untouched.
} else {
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
}
if(process.env.STUDIO_CANDIDATE_ONLY!=='true'){
command(['run','services','update','elevate-admin-migration','--project='+project,'--region='+region,'--update-env-vars=STUDIO_BROWSER_URL='+url+',STUDIO_BROWSER_PUBLIC_URL='+url,'--quiet']);
console.log(JSON.stringify({service:name,url,commit:sha,ready:state.ready,persistent:state.providerAuthStorage.persistent,authorizedWorkspace:true,anonymousWorkspaceDenied:true,adminSwitched:true,oldProviderRemoved:false,existingProviderLoginRecovery:'not verified'}));

}
