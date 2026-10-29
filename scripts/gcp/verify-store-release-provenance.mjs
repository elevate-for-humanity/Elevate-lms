import {pathToFileURL} from 'node:url';
const repository='elevate-for-humanity/Elevate-lms';
// GitHub reports a job's display name; older runs used its raw YAML job ID.
const deploymentJobNames=new Set(['deploy','Deploy and verify Store on Google']);
export async function verifyStoreReleaseProvenance({sha,mainSha,token,request=fetch}={}){
 if(!/^[a-f0-9]{40}$/.test(sha??'')||!/^[a-f0-9]{40}$/.test(mainSha??'')||!token)throw Error('STORE_RELEASE_SOURCE_REQUIRED');
 async function read(path){const r=await request('https://api.github.com/repos/'+repository+'/'+path,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'},redirect:'error',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('STORE_RELEASE_PROVENANCE_HTTP_'+r.status);return r.json();}
 const comparison=await read('compare/'+sha+'...'+mainSha);
 if(!['identical','ahead'].includes(comparison.status))throw Error('STORE_RELEASE_NOT_MAIN_ANCESTOR');
 const runs=await read('actions/runs?head_sha='+sha+'&event=workflow_dispatch&per_page=100');
 for(const run of runs.workflow_runs??[]){
  if(run.head_sha!==sha||run.path!=='.github/workflows/deploy-google-store-runtime.yml'||run.status!=='completed'||run.conclusion!=='success')continue;
  const jobs=await read('actions/runs/'+run.id+'/jobs?per_page=100');
  if(jobs.jobs?.some(j=>deploymentJobNames.has(j.name)&&j.status==='completed'&&j.conclusion==='success'))return {source:sha,acceptedDeploymentRun:run.id,mainAncestorVerified:true};
 }
 throw Error('STORE_RELEASE_ACCEPTED_DEPLOYMENT_REQUIRED');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(await verifyStoreReleaseProvenance({sha:process.env.STORE_PAYPAL_EXPECTED_SHA,mainSha:process.env.GITHUB_SHA,token:process.env.GH_TOKEN})));}catch(e){console.error(JSON.stringify({error:/^STORE_RELEASE_[A-Z0-9_]+$/.test(e.message??'')?e.message:'STORE_RELEASE_PROVENANCE_FAILED'}));process.exitCode=1;}}
