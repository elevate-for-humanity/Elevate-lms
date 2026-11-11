import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
import {PROVIDER_CONFIRMATION_REASON, isProviderConfirmationSnapshot} from '../../lib/devstudio/openhands/provider-confirmation.mjs';
import {observeAcceptedOpenHandsRepair, openHandsRepairPrompt} from '../../lib/devstudio/paris-openhands-repair.mjs';

const candidateSource=readFileSync(new URL('../../lib/devstudio/openhands/paris-provider-candidate.ts',import.meta.url),'utf8');
const candidateCode=stripTypeScriptTypes(candidateSource).replace(/^import .*;\n/gm,'').replaceAll('export ','');
const candidate=new Function('isProviderConfirmationSnapshot',candidateCode+';return isParisProviderBranchCandidate;')(isProviderConfirmationSnapshot);
const repairId='11111111-1111-4111-8111-111111111111', repo='elevate-for-humanity/Elevate-lms', goal='Repair the confirmed defect.';
function fixture(){
 const cp={version:1,repairId,actorId:'owner',attempt:1,runId:12,goalHash:createHash('sha256').update(goal).digest('hex'),
  correlationId:`paris-repair:${repairId}:attempt:1`,branch:`studio/paris-openhands-${repairId}-1`,baseSha:'a'.repeat(40),
  startedAt:1,sequence:1,branchPrepared:true,dispatchRequested:true,taskId:'task'};
 const task={id:'task',tool_name:'openhands.execute',user_id:'owner',tenant_id:null,correlation_id:cp.correlationId,
  command:openHandsRepairPrompt({...cp,goal}),tool_input:{repository:repo,branch:cp.branch},
  tool_output:{start_task_id:'same-start'},requires_approval:true,approval_status:'pending',
  approval_reason:PROVIDER_CONFIRMATION_REASON,status:'awaiting_approval'};
 const lifecycle={status:'completed',startTaskId:'same-start',repository:repo,branch:cp.branch,prNumbers:[]};
 const github={verified:false,repository:repo,branch:{name:cp.branch,sha:'b'.repeat(40)},pullRequests:[]};
 return {cp,task,lifecycle,github};
}
test('a completed same-receipt branch can retire only the provider-generated wait',()=>{
 const f=fixture();assert.equal(candidate(f.task,f.lifecycle,f.github),true);
 for(const patch of [{status:'running'},{status:'approval_required'},{startTaskId:'different'},{branch:'main'},{repository:'other/repo'}])
  assert.equal(candidate(f.task,{...f.lifecycle,...patch},f.github),false);
 for(const patch of [{approval_status:'rejected'},{approval_reason:'Human security review required'},{tool_output:{}},{user_id:'',tenant_id:'other'}])
  assert.equal(candidate({...f.task,...patch},f.lifecycle,f.github),false);
 assert.equal(candidate(f.task,f.lifecycle,{...f.github,branch:{name:f.cp.branch,sha:'short'}}),false);
});
test('observation refreshes a stale wait without starting work or admitting still-gated terminal output',async()=>{
 for(const mode of ['running','approval_required','completed-gated','completed-verified']){
  const f=fixture();let refreshes=0,reads=0;
  const status=mode.startsWith('completed')?'completed':mode;
  const lifecycle={...f.lifecycle,status};
  const refreshed=mode==='completed-verified'?{...f.task,status:'running',requires_approval:false,approval_status:'not_required'}:f.task;
  const observe=()=>observeAcceptedOpenHandsRepair({repairId,actorId:'owner',attempt:1,runId:12,goal,checkpoint:f.cp},{
   findTask:async()=>f.task,refresh:async()=>{refreshes++;return {task:refreshed,lifecycle}},
   readCandidate:async()=>{reads++;return {branch:f.github.branch}}});
  if(mode==='approval_required'||mode==='completed-gated')await assert.rejects(observe(),/APPROVAL_REQUIRED/);
  else assert.equal((await observe()).state,mode==='running'?'pending':'ready');
  assert.equal(refreshes,1);assert.equal(reads,mode==='completed-verified'?1:0);
 }
});
test('changed receipt and actor prevent terminal admission',async()=>{
 const f=fixture();let reads=0;
 await assert.rejects(observeAcceptedOpenHandsRepair({repairId,actorId:'owner',attempt:1,runId:12,goal,checkpoint:f.cp},{
  findTask:async()=>f.task,refresh:async()=>({task:{...f.task,tool_output:{start_task_id:'changed'}},lifecycle:f.lifecycle}),
  readCandidate:async()=>{reads++}}),/START_RECEIPT_CHANGED/);
 assert.equal(reads,0);
});

test('the real runtime retires a verified provider wait and fails closed on concurrent human changes',async()=>{
 const source=readFileSync(new URL('../../lib/devstudio/openhands/runtime.ts',import.meta.url),'utf8');
 const code=stripTypeScriptTypes(source).replace(/^import[\s\S]*?;\n/gm,'').replaceAll('export ','');
 for(const concurrent of [false,true]){
  const f=fixture();f.task.updated_at='2026-11-11T17:02:53Z';
  let saved=null;const filters=[];
  const db={from(table){
   let values=null;
   const q={select:()=>q,eq:(key,value)=>{if(values)filters.push([key,value]);return q},order:()=>q,
    single:async()=>({data:f.task,error:null}),
    update:value=>{values=value;saved=value;return q},insert:async()=>({error:null}),
    maybeSingle:async()=>({data:concurrent?null:{id:'task'},error:null}),
    then:resolve=>Promise.resolve({data:table==='ai_task_steps'?[]:null,error:null}).then(resolve)};
   return q;
  }};
  const refresh=new Function('requireAdminClient','getOpenHandsLifecycle','verifyOpenHandsGitHubOutcome',
   'isParisProviderBranchCandidate','isProviderConfirmationSnapshot',code+';return refreshOpenHandsTask;')(
    async()=>db,async()=>f.lifecycle,async()=>f.github,candidate,isProviderConfirmationSnapshot);
  if(concurrent)await assert.rejects(refresh({taskId:'task',actorId:'owner'}),/APPROVAL_STATE_CHANGED/);
  else {
   await refresh({taskId:'task',actorId:'owner'});
   assert.equal(saved.status,'running');assert.equal(saved.requires_approval,false);
   assert.equal(saved.approval_status,'not_required');assert.equal(saved.completed_at,null);
   assert.equal(saved.result_json.paris_provider_candidate_pending_validation,true);
  }
  assert.ok(filters.some(([key,value])=>key==='updated_at'&&value===f.task.updated_at));
  assert.ok(filters.some(([key,value])=>key==='approval_status'&&value==='pending'));
 }
});
