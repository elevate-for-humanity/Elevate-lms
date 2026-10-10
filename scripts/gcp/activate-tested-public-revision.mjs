import { google } from './runtime-config.mjs';
import { pathToFileURL } from 'node:url';
const project='elegant-racer-299721',region=process.env.CANDIDATE_REGION||'us-central1';
if(!['us-central1','us-east1'].includes(region))throw Error('Unsupported public runtime region');
function gcloud(args){const result=google([...args,'--project='+project,'--format=json']);return result.trim()?JSON.parse(result):{};}
function trafficRows(state){return [...(state.spec?.traffic||[]),...(state.status?.traffic||[])];}
export function unusedCandidateTags(state,exceptTag){
 const rows=trafficRows(state),serving=new Set(rows.filter(t=>t.percent>0).map(t=>t.revisionName));
 const tags=new Map();
 // Keep recognizing the legacy startup-gen2 tag after deleting its recovery workflow.
 for(const row of rows){if((!/^c-[a-f0-9]{12}$/.test(row.tag||'')&&row.tag!=='startup-gen2')||!row.revisionName)continue;const revisions=tags.get(row.tag)||new Set();revisions.add(row.revisionName);tags.set(row.tag,revisions);}
 return [...tags].filter(([tag,revisions])=>tag!==exceptTag&&revisions.size===1&&![...revisions].some(r=>serving.has(r))).map(([tag])=>tag);
}
export async function activateTestedRevision({service,revision,commit,read=gcloud,fetcher=fetch,attempts=12,pause=()=>new Promise(resolve=>setTimeout(resolve,2000))}){
 if(!['elevate-marketing-migration','elevate-store-migration','elevate-admin-migration'].includes(service)||!new RegExp('^'+service+'-[a-z0-9-]+$').test(revision||'')||!/^[a-f0-9]{40}$/.test(commit||''))throw Error('Exact service, revision and immutable commit required');
 const metadata=read(['run','revisions','describe',revision,'--region='+region]);
 if(!/@sha256:[a-f0-9]{64}$/.test(metadata.spec?.containers?.[0]?.image||''))throw Error('Candidate image must be immutable');
 const tag='c-'+commit.slice(0,12);
 const before=read(['run','services','describe',service,'--region='+region]);
 const staleTags=unusedCandidateTags(before,tag);
 try {
 // A pinned serving revision makes latestReadyRevisionName unsuitable as a
 // pre-activation gate. A zero-percent tag starts only the exact candidate.
 read(['run','services','update-traffic',service,'--region='+region,...(staleTags.length?['--remove-tags='+staleTags.join(',')]:[]),'--update-tags='+tag+'='+revision,'--quiet']);
 const candidate=read(['run','services','describe',service,'--region='+region]).status?.traffic?.find(item=>item.tag===tag&&item.revisionName===revision);
 if(!candidate?.url||new URL(candidate.url).protocol!=='https:'||!new URL(candidate.url).hostname.endsWith('.run.app'))throw Error('Google candidate URL unavailable; public traffic unchanged');
 let state,passed=false;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const response=await fetcher(candidate.url+'/api/health',{cache:'no-store',signal:AbortSignal.timeout(10000)});
   state=await response.json();
   if(response.ok){
    const actual=state.commitSha||state.commit||state.sha;
    if(actual!==commit)throw Error('Candidate served wrong immutable commit');
    if(state.healthy===true||state.ready===true){passed=true;break;}
   }
  }catch(error){if(error.message==='Candidate served wrong immutable commit')throw error;}
  if(attempt+1<attempts)await pause();
 }
 if(!passed)throw Error('Exact candidate failed runtime health; public traffic unchanged');
 read(['run','services','update-traffic',service,'--region='+region,'--to-revisions='+revision+'=100','--quiet']);
 const after=read(['run','services','describe',service,'--region='+region]);
 if(!after.status?.traffic?.some(item=>item.revisionName===revision&&item.percent===100))throw Error('Exact candidate traffic assignment not confirmed');
 // A formerly serving tagged revision is now idle. Release only temporary
 // candidate tags; keep serving/custom tags and every rollback revision.
 const retiredTags=unusedCandidateTags(after,tag);
 if(retiredTags.length)read(['run','services','update-traffic',service,'--region='+region,'--remove-tags='+retiredTags.join(','),'--quiet']);
 return {service,revision,commit,candidateUrl:candidate.url,candidateHealthy:true,traffic:100};
 }catch(error){
  // Cloud Run may retain a requested tag even when provisioning fails.
  // Never remove this tag if another operation moved it or made it serving.
  try{
   const current=read(['run','services','describe',service,'--region='+region]);
   const mappings=trafficRows(current).filter(t=>t.tag===tag);
   if(mappings.length&&mappings.every(t=>t.revisionName===revision)&&unusedCandidateTags(current).includes(tag))
    read(['run','services','update-traffic',service,'--region='+region,'--remove-tags='+tag,'--quiet']);
  }catch{ /* Preserve the original activation error if cleanup also fails. */ }
  throw error;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 console.log(JSON.stringify(await activateTestedRevision({service:process.env.CANDIDATE_SERVICE||'elevate-marketing-migration',revision:process.env.CANDIDATE_REVISION,commit:process.env.IMAGE_SHA||process.env.GITHUB_SHA})));
}
