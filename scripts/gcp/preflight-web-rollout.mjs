import {pathToFileURL} from 'node:url';
import {google, PROJECT} from './runtime-config.mjs';
import {inspectRegionalCapacity} from './regional-capacity.mjs';

// Reserve the replacement alongside all serving/tagged revisions and active jobs.
// This is configured capacity, not instantaneous CPU or memory utilization.
export async function preflightWebRollout({service,cpu,memory,region='us-central1',run=google,inspect=inspectRegionalCapacity}={}) {
  if(!/^elevate-(?:store|marketing|admin|lms)-migration$/.test(service||''))throw Error('Managed web service required');
  if((cpu!==undefined&&!/^[1-4]$/.test(String(cpu)))||(memory!==undefined&&!['2Gi','4Gi','8Gi'].includes(memory)))throw Error('Approved web candidate allocation required');
  const read=()=>JSON.parse(run(['run','services','describe',service,'--project='+PROJECT,'--region='+region,'--format=json']));
  const before=read();
  const current=before.spec?.template?.spec?.containers?.[0]?.resources?.limits;
  cpu=cpu??current?.cpu;
  memory=memory??current?.memory;
  const cpuMatch=String(cpu??'').match(/^(\d+)(m)?$/);
  cpu=cpuMatch?String(Number(cpuMatch[1])/(cpuMatch[2]?1000:1)):'';
  if(!/^[1-4]$/.test(cpu)||!['2Gi','4Gi','8Gi'].includes(memory))throw Error('Approved web candidate allocation required');
  const result=await inspect({region,run,task:{containers:[{resources:{limits:{cpu:String(cpu),memory}}}]},taskCount:1});
  if(result.fits!==true) {
    const error=Error('WEB_ROLLOUT_REGIONAL_CAPACITY_UNAVAILABLE');
    error.code='WEB_ROLLOUT_REGIONAL_CAPACITY_UNAVAILABLE';
    // Keep the allocation receipt, never the service spec or its environment.
    error.diagnostic={service,region,candidate:{cpu:String(cpu),memory},capacity:result};
    throw error;
  }
  const after=read();
  if(before.status?.latestCreatedRevisionName!==after.status?.latestCreatedRevisionName||JSON.stringify(before.status?.traffic)!==JSON.stringify(after.status?.traffic))
    throw Error('Concurrent web release; repeat capacity preflight');
  return {service,region,candidate:{cpu:String(cpu),memory},capacity:result};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  preflightWebRollout({service:process.env.CANDIDATE_SERVICE,cpu:process.env.CANDIDATE_CPU,memory:process.env.CANDIDATE_MEMORY})
    .then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(JSON.stringify({error:error.code||error.message,diagnostic:error.diagnostic}));process.exitCode=1;});
}
