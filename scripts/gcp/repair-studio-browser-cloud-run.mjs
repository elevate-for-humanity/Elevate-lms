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
const identity='elevate-admin-runtime@'+project+'.iam.gserviceaccount.com';
const bucket=project+'-studio-browser-auth',secretName='studio-browser-shared-secret';
function command(args,input){return execFileSync('gcloud',args,{encoding:'utf8',input,timeout:900000,stdio:['pipe','pipe','pipe']}).trim();}
function gc(args){return command([...args,'--project='+project,'--format=json']);}
const admin=JSON.parse(gc(['run','services','describe','elevate-admin-migration','--region='+region]));
const variable=admin.spec.template.spec.containers[0].env.find(x=>x.name==='STUDIO_BROWSER_SECRET');
let secret=variable?.value;
if(!secret && variable?.valueFrom?.secretKeyRef){const ref=variable.valueFrom.secretKeyRef;secret=command(['secrets','versions','access',ref.key||'latest','--secret='+ref.name,'--project='+project]);}
if(!secret || secret.length<16)throw Error('Existing Studio secret unavailable; refusing unauthenticated deployment or credential rotation');
const existing=JSON.parse(gc(['secrets','list','--filter=name:'+secretName]));
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
let url,state;
try {
command(['run','deploy',name,'--project='+project,'--region='+region,'--image='+image+'@'+digest,'--service-account='+identity,'--port=3100','--cpu=2','--memory=4Gi','--min-instances=1','--max-instances=1','--concurrency=20','--no-cpu-throttling','--timeout=3600','--execution-environment=gen2','--allow-unauthenticated','--set-env-vars=STUDIO_BROWSER_AUTH_STATE_DIR=/var/lib/studio-browser-auth,STUDIO_BROWSER_ADMIN_ORIGIN=https://admin.elevateforhumanity.org','--set-secrets=STUDIO_BROWSER_SECRET='+secretName+':latest','--add-volume=mount-path=/var/lib/studio-browser-auth,type=cloud-storage,bucket='+bucket+',mount-options=uid=1001;gid=1001;file-mode=600;dir-mode=700','--startup-probe=httpGet.path=/health,httpGet.port=3100,initialDelaySeconds=5,periodSeconds=10,timeoutSeconds=5,failureThreshold=24','--quiet']);
const service=JSON.parse(gc(['run','services','describe',name,'--region='+region]));
url=service.status.url;
const health=await fetch(url+'/health',{signal:AbortSignal.timeout(20000)});
state=await health.json();
if(!health.ok||state.commit!==sha||!state.ready||!state.providerAuthStorage?.persistent)throw Error('Browser or durable encrypted auth storage not ready; Admin was not switched');
const unauthorized=await fetch(url+'/workspace/files',{signal:AbortSignal.timeout(20000)});
if(unauthorized.status!==401)throw Error('Browser service authorization boundary failed; Admin was not switched');
const authorized=await fetch(url+'/workspace/files',{headers:{'x-studio-browser-secret':secret},signal:AbortSignal.timeout(20000)});
if(!authorized.ok)throw Error('Authenticated workspace proof failed; Admin was not switched');
} catch(error) {
  await collectStartupDiagnostics(secret);
  throw new Error(String(error.message).split(secret).join('[REDACTED]'));
}
command(['run','services','update','elevate-admin-migration','--project='+project,'--region='+region,'--update-env-vars=STUDIO_BROWSER_URL='+url+',STUDIO_BROWSER_PUBLIC_URL='+url,'--quiet']);
console.log(JSON.stringify({service:name,url,commit:sha,ready:state.ready,persistent:state.providerAuthStorage.persistent,authorizedWorkspace:true,anonymousWorkspaceDenied:true,adminSwitched:true,oldProviderRemoved:false,existingProviderLoginRecovery:'not verified'}));
