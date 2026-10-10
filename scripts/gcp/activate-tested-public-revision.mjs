import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const project='elegant-racer-299721',region='us-central1';
function gcloud(args){const result=execFileSync('gcloud',[...args,'--project='+project,'--format=json'],{encoding:'utf8',timeout:180000,stdio:['ignore','pipe','pipe']});return result.trim()?JSON.parse(result):{};}
export async function activateTestedRevision({service,revision,commit,read=gcloud,fetcher=fetch,attempts=12,pause=()=>new Promise(resolve=>setTimeout(resolve,2000))}){
 if(!['elevate-marketing-migration','elevate-store-migration'].includes(service)||!new RegExp('^'+service+'-[a-z0-9-]+$').test(revision||'')||!/^[a-f0-9]{40}$/.test(commit||''))throw Error('Exact service, revision and immutable commit required');
 const metadata=read(['run','revisions','describe',revision,'--region='+region]);
 if(!/@sha256:[a-f0-9]{64}$/.test(metadata.spec?.containers?.[0]?.image||''))throw Error('Candidate image must be immutable');
 const tag='c-'+commit.slice(0,12);
 // A pinned serving revision makes latestReadyRevisionName unsuitable as a
 // pre-activation gate. A zero-percent tag starts only the exact candidate.
 read(['run','services','update-traffic',service,'--region='+region,'--update-tags='+tag+'='+revision,'--quiet']);
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
 return {service,revision,commit,candidateUrl:candidate.url,candidateHealthy:true,traffic:100};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 console.log(JSON.stringify(await activateTestedRevision({service:process.env.CANDIDATE_SERVICE||'elevate-marketing-migration',revision:process.env.CANDIDATE_REVISION,commit:process.env.IMAGE_SHA||process.env.GITHUB_SHA})));
}
