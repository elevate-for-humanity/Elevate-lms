import {pathToFileURL} from 'node:url';
import {google,PROJECT,loadGoogleConfig} from './runtime-config.mjs';
import {modelCredential} from './deploy-owned-llm.mjs';
import {acceptOwnedCpuModel} from './accept-owned-cpu-model.mjs';
const name='elevate-owned-cpu-llm';
function valid(state){
 const c=state.spec?.template?.spec?.containers?.[0],traffic=state.status?.traffic?.filter(x=>x.percent>0)||[];
 return state.metadata?.name===name&&c?.resources?.limits?.cpu==='4'&&c?.resources?.limits?.memory==='8Gi'&&
  new RegExp('^us-central1-docker\\.pkg\\.dev/'+PROJECT+'/elevate/owned-cpu-llm@sha256:[a-f0-9]{64}$').test(c?.image||'')&&
  (state.spec?.template?.metadata?.annotations?.['autoscaling.knative.dev/minScale']||'0')==='0'&&
  state.status?.conditions?.some(x=>x.type==='Ready'&&x.status==='True')&&traffic.length===1&&traffic[0].percent===100&&
  traffic[0].revisionName===state.status.latestReadyRevisionName&&state.status.latestReadyRevisionName===state.status.latestCreatedRevisionName;
}
export async function reduceModelIdle({read,update,accept}){
 const before=read();if(!valid(before))throw Error('MODEL_IDLE_TOPOLOGY_UNVERIFIED');
 const min=before.metadata?.annotations?.['run.googleapis.com/minScale']||'0';
 if(!['0','1'].includes(min))throw Error('MODEL_IDLE_MINIMUM_UNEXPECTED');
 if((await accept(before.status.url))?.passed!==true)throw Error('MODEL_IDLE_FUNCTIONAL_ACCEPTANCE_REQUIRED');
 if(min==='0')return {service:name,unchanged:true,minimumInstances:0,functionalAcceptance:true};
 try{
  update('0');
  const after=read();
  if(!valid(after)||JSON.stringify(after.spec)!==JSON.stringify(before.spec)||
    after.status.latestReadyRevisionName!==before.status.latestReadyRevisionName||
    (after.metadata?.annotations?.['run.googleapis.com/minScale']||'0')!=='0')throw Error('MODEL_IDLE_READBACK_FAILED');
  if((await accept(after.status.url))?.passed!==true)throw Error('MODEL_IDLE_POST_CHANGE_ACCEPTANCE_FAILED');
  return {service:name,minimumInstances:0,previousMinimumInstances:1,removedReservedCpu:4,removedReservedMemoryGiB:8,imageUnchanged:true,functionalAcceptance:true,coldStartLatencyMeasured:false,policy:'wake on request; no in-flight work is force-stopped'};
 }catch(error){
  const current=read();
  if(JSON.stringify(current.spec)===JSON.stringify(before.spec)&&current.status.latestReadyRevisionName===before.status.latestReadyRevisionName){
   update('1');
   if((read().metadata?.annotations?.['run.googleapis.com/minScale']||'0')!=='1')throw Error('MODEL_IDLE_ROLLBACK_READBACK_FAILED');
   throw Error('MODEL_IDLE_CHANGE_ROLLED_BACK');
  }
  throw Error('MODEL_IDLE_CONCURRENT_CHANGE_REQUIRES_REVIEW');
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const invokerToken=process.env.MODEL_INVOKER_TOKEN;if(!invokerToken)throw Error('MODEL_IDLE_INVOCATION_IDENTITY_REQUIRED');
  const token=modelCredential(loadGoogleConfig('admin'));
  const scope=['--project='+PROJECT,'--region=us-east1'];
  const result=await reduceModelIdle({read:()=>JSON.parse(google(['run','services','describe',name,...scope,'--format=json'])),update:min=>google(['run','services','update',name,...scope,'--min='+min,'--quiet']),accept:base=>acceptOwnedCpuModel({base,token,invokerToken})});
  console.log(JSON.stringify(result));
 }catch(error){console.error(JSON.stringify({service:name,verifiedSavings:false,reason:/^MODEL_IDLE_[A-Z_]+$/.test(error.message||'')?error.message:error.code||'MODEL_IDLE_ACCEPTANCE_UNAVAILABLE'}));process.exitCode=1;}
}
