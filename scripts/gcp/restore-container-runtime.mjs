import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {google,loadGoogleConfig,PROJECT} from './runtime-config.mjs';
import {activateTestedRevision} from './activate-tested-public-revision.mjs';

export const profiles = {
  marketing:{name:'elevate-marketing-migration',cpu:'4',memory:'8Gi',port:3000},
  admin:{name:'elevate-admin-migration',cpu:'4',memory:'8Gi',port:3000},
  lms:{name:'elevate-lms-migration',cpu:'4',memory:'8Gi',port:3000},
  store:{name:'elevate-store-migration',cpu:'4',memory:'8Gi',port:3000},
  'studio-browser':{name:'elevate-studio-browser',cpu:'2',memory:'4Gi',port:3100}
};
export function mergedBrowserEnvironment(source,rows) {
  const literal=Object.fromEntries(rows.filter(r=>typeof r.value==='string').map(r=>[r.name,r.value]));
  const secretNames=new Set(rows.filter(r=>r.valueFrom||r.valueSource).map(r=>r.name));
  for(const [key,value] of Object.entries(source)) {
    if(['PORT','K_SERVICE','K_REVISION','K_CONFIGURATION'].includes(key)||key.startsWith('X_GOOGLE_')||secretNames.has(key))continue;
    if(typeof value!=='string'||/\$\{[^}]+\}/.test(value))throw Error('Unresolved browser setting');
    if(!(key in literal))literal[key]=value;
  }
  literal.STUDIO_LEARNER_LMS_URL='https://app.elevateforhumanity.org';
  literal.STUDIO_BROWSER_AUTH_STATE_DIR='/var/lib/studio-browser-auth';
  literal.STUDIO_BROWSER_ADMIN_ORIGIN='https://admin.elevateforhumanity.org';
  return literal;
}
export function unusedBrowserVolumes(spec,bucket) {
  const mounted=new Set(spec.containers.flatMap(c=>(c.volumeMounts||[]).map(m=>m.name)));
  return (spec.volumes||[]).filter(v=>!mounted.has(v.name)&&
    v.csi?.driver==='gcsfuse.run.googleapis.com'&&v.csi?.volumeAttributes?.bucketName===bucket).map(v=>v.name);
}
const scope=['--project='+PROJECT,'--region=us-central1'];
const read=args=>JSON.parse(google([...args,...scope,'--format=json']));
async function restore(component) {
  const profile=profiles[component],before=read(['run','services','describe',profile.name]);
  const spec=before.spec.template.spec,container=spec.containers[0];
  if(spec.containers.length!==1||!/@sha256:[a-f0-9]{64}$/.test(container.image))throw Error('Immutable single-container service required');
  const serving=before.status.traffic?.find(t=>t.percent===100&&t.revisionName);
  const live=serving?read(['run','revisions','describe',serving.revisionName]):null;
  const liveContainer=live?.spec?.containers?.[0];
  const capacityMatched=liveContainer?.resources?.limits?.cpu===profile.cpu&&liveContainer?.resources?.limits?.memory===profile.memory;
  console.log(JSON.stringify({component,servingRevision:serving?.revisionName,servingCpu:liveContainer?.resources?.limits?.cpu,servingMemory:liveContainer?.resources?.limits?.memory,capacityMatched}));
  const changed=!capacityMatched;
  const extra=[];let directory;
  if(component==='studio-browser') {
    const config=loadGoogleConfig(component);
    const ref=container.env?.find(v=>v.name==='STUDIO_BROWSER_SECRET')?.valueFrom?.secretKeyRef;
    if(ref) {
      const actual=google(['secrets','versions','access',ref.key||'latest','--secret',ref.name,'--project='+PROJECT]);
      if(actual!==config.runtimeEnvironment.STUDIO_BROWSER_SECRET)throw Error('Browser encryption credential mismatch; no change');
    }
    const vars=mergedBrowserEnvironment(config.runtimeEnvironment,container.env||[]);
    directory=mkdtempSync(join(tmpdir(),'elevate-browser-env-'));
    const file=join(directory,'environment.json');writeFileSync(file,JSON.stringify(vars),{mode:0o600});
    extra.push('--env-vars-file='+file);
    const refs=(container.env||[]).filter(v=>v.valueFrom?.secretKeyRef).map(v=>v.name+'='+v.valueFrom.secretKeyRef.name+':'+(v.valueFrom.secretKeyRef.key||'latest'));
    if(refs.length)extra.push('--update-secrets='+refs.join(','));
    const stale=unusedBrowserVolumes(spec,PROJECT+'-studio-browser-auth');
    if(stale.length)extra.push('--remove-volume='+stale.join(','));
    extra.push('--liveness-probe=httpGet.path=/health,httpGet.port=3100,periodSeconds=30,timeoutSeconds=5,failureThreshold=3');
  }
  if(!changed&&component!=='studio-browser')return {component,changed:false,cpu:profile.cpu,memory:profile.memory};
  const current=read(['run','services','describe',profile.name]);
  if(current.status.latestCreatedRevisionName!==before.status.latestCreatedRevisionName)throw Error('Concurrent deployment; retry after it completes');
  const suffix='runtime-'+Date.now().toString(36);
  try {
    google(['run','services','update',profile.name,...scope,'--cpu='+profile.cpu,'--memory='+profile.memory,
      '--revision-suffix='+suffix,'--no-traffic',...extra,'--quiet']);
    const after=read(['run','services','describe',profile.name]);
    const candidate=profile.name+'-'+suffix;
    if(after.status.latestCreatedRevisionName!==candidate||after.spec.template.spec.containers[0].image!==container.image)
      throw Error('Container image changed during runtime restoration');
    if(component==='studio-browser') {
      google(['run','services','update-traffic',profile.name,...scope,'--update-tags=runtime-check='+candidate,'--quiet']);
      try {
        const state=read(['run','services','describe',profile.name]);
        const url=state.status.traffic.find(t=>t.tag==='runtime-check')?.url;
        if(!url)throw Error('Browser test URL unavailable');
        const response=await fetch(url+'/health',{signal:AbortSignal.timeout(30000)});
        const body=await response.json();
        if(!response.ok||!body.ready||!body.providerAuthStorage?.persistent)throw Error('Browser health or persistence failed');
        const again=read(['run','services','describe',profile.name]);
        if(again.status.latestCreatedRevisionName!==candidate)throw Error('Concurrent browser release; no promotion');
        google(['run','services','update-traffic',profile.name,...scope,'--to-revisions='+candidate+'=100','--quiet']);
      } finally {google(['run','services','update-traffic',profile.name,...scope,'--remove-tags=runtime-check','--quiet']);}
    } else {
      const origins={marketing:'https://www.elevateforhumanity.org',admin:'https://admin.elevateforhumanity.org',lms:'https://app.elevateforhumanity.org',store:'https://store.elevateforhumanity.org'};
      const original=await fetch(origins[component]+'/api/version',{signal:AbortSignal.timeout(60000)});
      const version=await original.json();const commit=version.commitSha||version.commit;
      if(!/^[a-f0-9]{40}$/.test(commit||''))throw Error('Serving image identity unavailable');
      await activateTestedRevision({service:profile.name,revision:candidate,commit});
    }
    const verified=read(['run','services','describe',profile.name]);
    const limits=verified.spec.template.spec.containers[0].resources.limits;
    if(limits.cpu!==profile.cpu||limits.memory!==profile.memory||!verified.status.traffic.some(t=>t.revisionName===candidate&&t.percent===100))
      throw Error('Runtime readback or traffic check failed');
    return {component,changed:true,cpu:limits.cpu,memory:limits.memory,revision:candidate,imagePreserved:true,healthVerified:true};
  } finally {if(directory)rmSync(directory,{recursive:true,force:true});}
}
export function quotaContactEmail(values) {
  return values.find(v=>typeof v==='string' && v===v.trim() &&
    !Array.from(v).some(ch=>ch.trim()==='') && v.split('@').length===2 &&
    Boolean(v.split('@')[0]) && v.split('@')[1].includes('.') && !v.endsWith('.'));
}
async function reportAndRequestQuota() {
  const token=google(['auth','print-access-token']);
  const base='https://cloudquotas.googleapis.com/v1/projects/484736877039/locations/global';
  const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
  const admin=loadGoogleConfig('admin').runtimeEnvironment;
  const contact=quotaContactEmail([process.env.QUOTA_CONTACT_EMAIL,admin.NEXT_PUBLIC_SUPPORT_EMAIL,admin.SUPPORT_EMAIL,admin.CONTACT_EMAIL]);
  for(const [quotaId,desired] of [['MemAllocPerProjectRegion',64*2**30],['CpuAllocPerProjectRegion',32000]]) {
    const response=await fetch(base+'/services/run.googleapis.com/quotaInfos/'+quotaId,{headers,signal:AbortSignal.timeout(30000)});
    const info=await response.json();
    if(!response.ok){console.log(JSON.stringify({quotaId,readStatus:response.status,requestSubmitted:false}));continue;}
    const granted=Number(info.dimensionsInfos?.find(d=>d.dimensions?.region==='us-central1')?.details?.value);
    if(!Number.isFinite(granted))throw Error('Regional quota dimensions unavailable');
    const report={quotaId,region:'us-central1',granted,desired,requestSubmitted:false};
    if(granted===-1||granted>=desired){console.log(JSON.stringify(report));continue;}
    if(!contact){console.log(JSON.stringify({...report,reason:'verified_contact_email_required'}));continue;}
    const listed=await fetch(base+'/quotaPreferences?pageSize=100',{headers,signal:AbortSignal.timeout(30000)});
    const list=await listed.json();
    if(!listed.ok){console.log(JSON.stringify({...report,reason:'quota_request_permission_unavailable',httpStatus:listed.status}));continue;}
    const current=list.quotaPreferences?.find(p=>p.service==='run.googleapis.com'&&p.quotaId===quotaId&&p.dimensions?.region==='us-central1');
    if(current&&Number(current.quotaConfig?.preferredValue)>=desired&&current.reconciling===true){console.log(JSON.stringify({...report,existingRequest:true,pending:true,preferenceGranted:current.quotaConfig?.grantedValue}));continue;}
    const payload={service:'run.googleapis.com',quotaId,dimensions:{region:'us-central1'},quotaConfig:{preferredValue:String(desired)},contactEmail:contact,
      justification:'Restore migrated Elevate platform containers to their original Northflank 4 CPU and 8 GiB configuration, with bounded browser and course-worker capacity and safe revision overlap.'};
    const url=current?'https://cloudquotas.googleapis.com/v1/'+current.name+'?updateMask=quotaConfig,justification,contactEmail':base+'/quotaPreferences';
    const result=await fetch(url,{method:current?'PATCH':'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
    const outcome=await result.json();
    console.log(JSON.stringify({...report,requestSubmitted:result.ok,httpStatus:result.status,pending:result.ok?outcome.reconciling:undefined,
      reason:result.ok?undefined:outcome.error?.status||'quota_request_failed'}));
  }
}

async function main() {
  await reportAndRequestQuota();
  const components=(process.env.COMPONENTS||'marketing,lms,store,admin,studio-browser').split(',');
  if(components.some(c=>!profiles[c]))throw Error('Unsupported component');
  let failed=false;
  for(const component of components) {
    try{console.log(JSON.stringify(await restore(component)));}
    catch(e){failed=true;console.error(JSON.stringify({component,restored:false,reason:e.code||'runtime_restore_failed',detail:e.message}));}
  }
  if(failed)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('Runtime restoration failed; inspect provider status.');process.exitCode=1;});

