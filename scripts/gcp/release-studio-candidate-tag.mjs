import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {google, PROJECT} from './runtime-config.mjs';

const service='elevate-studio-browser', tag='studio-verify';
const serving=s=>(s.status?.traffic??[]).filter(t=>Number(t.percent)>0)
  .map(t=>[t.revisionName,Number(t.percent)]).sort((a,b)=>a[0].localeCompare(b[0]));
/** Remove only an exact non-serving verification alias. Keep its revision,
 * all production sessions, workspace storage, runtime settings and traffic. */
export function releaseStudioCandidateTag({revision,run=google}={}) {
  if(!/^elevate-studio-browser-[a-z0-9-]+$/.test(revision??''))throw Error('STUDIO_CANDIDATE_REVISION_REQUIRED');
  const read=()=>JSON.parse(run(['run','services','describe',service,'--project='+PROJECT,'--region=us-central1','--format=json']));
  const before=read(), traffic=serving(before);
  if(traffic.reduce((n,t)=>n+t[1],0)!==100||traffic.some(t=>!t[0]))throw Error('STUDIO_SERVING_TRAFFIC_UNVERIFIED');
  if(traffic.some(t=>t[0]===revision))throw Error('STUDIO_SERVING_REVISION_PROTECTED');
  const candidate=before.status?.traffic?.find(t=>t.tag===tag);
  if(!candidate)return {changed:false,revision,servingTrafficPreserved:true};
  if(candidate.revisionName!==revision||Number(candidate.percent??0)!==0)throw Error('STUDIO_CANDIDATE_TAG_CHANGED');
  run(['run','services','update-traffic',service,'--project='+PROJECT,'--region=us-central1','--remove-tags='+tag,'--quiet']);
  const after=read();
  if(!isDeepStrictEqual(traffic,serving(after))||
    !isDeepStrictEqual(before.spec?.template,after.spec?.template)||
    before.status?.latestCreatedRevisionName!==after.status?.latestCreatedRevisionName||
    after.status?.traffic?.some(t=>t.tag===tag))throw Error('STUDIO_CANDIDATE_CLEANUP_READBACK_REQUIRED');
  return {changed:true,revision,removedTag:tag,revisionRetained:true,servingTrafficPreserved:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{console.log(JSON.stringify(releaseStudioCandidateTag({revision:process.env.STUDIO_CANDIDATE_REVISION})));}
  catch(error){console.error(JSON.stringify({error:/^STUDIO_[A-Z_]+$/.test(error.message??'')?error.message:'STUDIO_CANDIDATE_CLEANUP_FAILED'}));process.exitCode=1;}
}
