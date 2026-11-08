import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';
import {releaseStudioCandidateTag} from './release-studio-candidate-tag.mjs';
import {inventoryStudioLiveState} from './inventory-studio-live-state.mjs';
import {isTerminalExecution} from './regional-capacity.mjs';

export function browserConsumerBindings(run=google){
 const bindings=[];
 function add(spec,name){
  if(!Array.isArray(spec?.containers)||!spec.containers.length)throw Error('BROWSER_CONSUMER_INVENTORY_UNAVAILABLE');
  for(const container of spec.containers)for(const row of container.env||[]){
   if(!['STUDIO_BROWSER_URL','STUDIO_BROWSER_PUBLIC_URL','ULTIMATE_LEARNER_RUNTHROUGH_URL'].includes(row.name))continue;
   let value=row.value;
   if(typeof value!=='string'){
    const ref=row.valueFrom?.secretKeyRef;
    if(!/^[A-Za-z0-9_-]+$/.test(ref?.name||'')||!/^(latest|[1-9][0-9]*)$/.test(ref?.key||''))throw Error('BROWSER_CONSUMER_REFERENCE_UNVERIFIED');
    value=run(['secrets','versions','access',ref.key,'--secret='+ref.name,'--project='+PROJECT]);
   }
   bindings.push({consumer:name,variable:row.name,value});
  }
 }
 for(const region of ['us-central1','us-east1']){
  const scope=['--project='+PROJECT,'--region='+region,'--format=json'];
  const services=JSON.parse(run(['run','services','list',...scope]));
  const jobs=JSON.parse(run(['run','jobs','list',...scope]));
  if(!Array.isArray(services)||!Array.isArray(jobs))throw Error('BROWSER_CONSUMER_INVENTORY_UNAVAILABLE');
  for(const item of services){
   add(item.spec?.template?.spec,item.metadata?.name);
   for(const traffic of item.status?.traffic||[])if(traffic.percent>0){
    if(!/^[a-z0-9-]+$/.test(traffic.revisionName||''))throw Error('BROWSER_CONSUMER_INVENTORY_UNAVAILABLE');
    const revision=JSON.parse(run(['run','revisions','describe',traffic.revisionName,...scope]));
    add(revision.spec,item.metadata?.name);
   }
  }
  for(const item of jobs){
   add(item.spec?.template?.spec?.template?.spec,item.metadata?.name);
   const executions=JSON.parse(run(['run','jobs','executions','list','--job='+item.metadata.name,...scope]));
   if(!Array.isArray(executions))throw Error('BROWSER_CONSUMER_INVENTORY_UNAVAILABLE');
   for(const execution of executions)if(!isTerminalExecution(execution))add(execution.spec?.template?.spec,item.metadata.name);
  }
 }
 return bindings;
}

export async function releaseEmptyBrowserAliases({run=google,release=releaseStudioCandidateTag}={}){
 const scope=['--project='+PROJECT,'--region=us-central1'];
 const service=JSON.parse(run(['run','services','describe','elevate-studio-browser',...scope,'--format=json']));
 const traffic=service.status?.traffic||[];
 const serving=new Set(traffic.filter(x=>x.percent>0).map(x=>x.revisionName));
 const candidates=traffic.filter(x=>!x.percent&&!serving.has(x.revisionName)&&x.revisionName!==service.status?.latestCreatedRevisionName&&/^sc-[a-f0-9]{8}-[a-f0-9]{8}$/.test(x.tag||''));
 const consumers=browserConsumerBindings(run);
 const results=[];
 for(const candidate of candidates){
  // A binding anywhere in the managed service/job inventory protects the
  // candidate. Never serialize those resources: environment values are private.
  if(consumers.some(x=>x.value.includes(candidate.tag+'---'))){results.push({tag:candidate.tag,removed:false,reason:'active_runtime_binding'});continue;}
  let observed;
  try{results.push(await release({revision:candidate.revisionName,tag:candidate.tag,run,inventory:async options=>{observed=await inventoryStudioLiveState(options);return observed;}}));}
  catch(error){results.push({tag:candidate.tag,removed:error.message==='STUDIO_CANDIDATE_CLEANUP_READBACK_REQUIRED'?null:false,workspaceFiles:observed?.workspace?.files,activeBrowserSessions:observed?.activeBrowserSessions,shells:observed?.directChildShells,reason:/^STUDIO_[A-Z_]+$/.test(error.message||'')?error.message:'preservation_proof_unavailable'});}
 }
 return {checkedAt:new Date().toISOString(),service:'elevate-studio-browser',removed:results.filter(x=>x.changed===true).length,results,imagesAndRevisionsRetained:true,primaryTrafficPreserved:results.every(x=>x.removed!==null)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(await releaseEmptyBrowserAliases()));}
 catch(error){console.error(JSON.stringify({removed:0,reason:/^BROWSER_[A-Z_]+$/.test(error.message||'')?error.message:error.code||'BROWSER_ALIAS_REVIEW_UNAVAILABLE'}));process.exitCode=1;}
}
