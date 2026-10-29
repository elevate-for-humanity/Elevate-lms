import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {google, PROJECT, loadGoogleConfig} from './runtime-config.mjs';

const service='elevate-studio-browser';
const serving=s=>(s.status?.traffic??[]).filter(t=>Number(t.percent)>0)
  .map(t=>[t.revisionName,Number(t.percent)]).sort((a,b)=>a[0].localeCompare(b[0]));
/** Remove only an exact non-serving verification alias. Keep its revision,
 * all production sessions, workspace storage, runtime settings and traffic. */
export function releaseStudioCandidateTag({revision,tag='studio-verify',run=google,readConfig=()=>loadGoogleConfig('admin',run)}={}) {
  if(!/^elevate-studio-browser-[a-z0-9-]+$/.test(revision??''))throw Error('STUDIO_CANDIDATE_REVISION_REQUIRED');
  if(!/^(?:studio-verify|sc-[a-f0-9]{8}-[a-f0-9]{8})$/.test(tag))throw Error('STUDIO_CANDIDATE_TAG_REQUIRED');
  const read=()=>JSON.parse(run(['run','services','describe',service,'--project='+PROJECT,'--region=us-central1','--format=json']));
  const before=read(), traffic=serving(before);
  if(traffic.reduce((n,t)=>n+t[1],0)!==100||traffic.some(t=>!t[0]))throw Error('STUDIO_SERVING_TRAFFIC_UNVERIFIED');
  if(traffic.some(t=>t[0]===revision))throw Error('STUDIO_SERVING_REVISION_PROTECTED');
  const candidate=before.status?.traffic?.find(t=>t.tag===tag);
  if(!candidate)return {changed:false,revision,servingTrafficPreserved:true};
  if(candidate.revisionName!==revision||Number(candidate.percent??0)!==0)throw Error('STUDIO_CANDIDATE_TAG_CHANGED');
  if(before.spec?.traffic?.some(t=>Number(t.percent)>0&&(t.revisionName===revision||(t.latestRevision&&before.status.latestCreatedRevisionName===revision))))throw Error('STUDIO_SERVING_REVISION_PROTECTED');
  const hasOtherAlias=s=>s.status?.traffic?.some(t=>t.revisionName===revision&&t.tag&&t.tag!==tag);
  if(hasOtherAlias(before))throw Error('STUDIO_CANDIDATE_STILL_REFERENCED');
  if(tag.startsWith('sc-')){
    const admin=JSON.parse(run(['run','services','describe','elevate-admin-migration','--project='+PROJECT,'--region=us-central1','--format=json']));
    const config=readConfig();
    const names=['STUDIO_BROWSER_URL','STUDIO_BROWSER_PUBLIC_URL'];
    const bindings=(admin.spec?.template?.spec?.containers||[]).flatMap(c=>c.env||[]).filter(e=>names.includes(e.name));
    if(bindings.some(e=>e.valueFrom||e.valueSource))throw Error('STUDIO_ADMIN_BINDING_UNVERIFIED');
    const urls=[...bindings.map(e=>e.value),...names.map(name=>config?.runtimeEnvironment?.[name])].filter(Boolean);
    if(!urls.length)throw Error('STUDIO_ADMIN_BINDING_UNVERIFIED');
    for(const value of urls){const url=new URL(value);if(url.hostname.startsWith(tag+'---'))throw Error('STUDIO_CANDIDATE_STILL_REFERENCED');}
  }
  run(['run','services','update-traffic',service,'--project='+PROJECT,'--region=us-central1','--remove-tags='+tag,'--quiet']);
  const after=read();
  if(!isDeepStrictEqual(traffic,serving(after))||
    !isDeepStrictEqual(before.spec?.template,after.spec?.template)||
    before.status?.latestCreatedRevisionName!==after.status?.latestCreatedRevisionName||
    after.status?.traffic?.some(t=>t.tag===tag)||hasOtherAlias(after))throw Error('STUDIO_CANDIDATE_CLEANUP_READBACK_REQUIRED');
  return {changed:true,revision,removedTag:tag,revisionRetained:true,servingTrafficPreserved:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{console.log(JSON.stringify(releaseStudioCandidateTag({revision:process.env.STUDIO_CANDIDATE_REVISION,tag:process.env.STUDIO_CANDIDATE_TAG||'studio-verify'})));}
  catch(error){console.error(JSON.stringify({error:/^STUDIO_[A-Z_]+$/.test(error.message??'')?error.message:'STUDIO_CANDIDATE_CLEANUP_FAILED'}));process.exitCode=1;}
}
