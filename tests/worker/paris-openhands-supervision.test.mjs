import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {observeAcceptedOpenHandsRepair,openHandsRepairPrompt} from '../../lib/devstudio/paris-openhands-repair.mjs';
import {acceptedOpenHandsNeedsObservation,superviseAcceptedOpenHandsRepair} from '../../lib/devstudio/paris-openhands-supervision.mjs';
const repairId='11111111-1111-4111-8111-111111111111', goal='Repair confirmed captions failure.';
const now=4*60*60_000;
function fixture(){
 const cp={version:1,repairId,actorId:'owner',attempt:1,runId:12,goalHash:createHash('sha256').update(goal).digest('hex'),
  correlationId:`paris-repair:${repairId}:attempt:1`,branch:`studio/paris-openhands-${repairId}-1`,baseSha:'a'.repeat(40),
  startedAt:1,sequence:3,branchPrepared:true,dispatchRequested:true,taskId:'task'};
 const task={id:'task',tool_name:'openhands.execute',user_id:'owner',tenant_id:null,correlation_id:cp.correlationId,
  command:openHandsRepairPrompt({...cp,goal}),requires_approval:false,approval_status:'not_required',status:'running',
  tool_input:{repository:'elevate-for-humanity/Elevate-lms',branch:cp.branch},tool_output:{start_task_id:'provider-start'}};
 const candidate={provider:'openhands',branch:{name:cp.branch,sha:'b'.repeat(40)},base_sha:cp.baseSha};
 const h={cp,task,candidate,refreshes:0,reads:0,claims:[],records:[],eligible:true,claimWins:true,
  lifecycle:{status:'running',startTaskId:'provider-start',repository:'elevate-for-humanity/Elevate-lms',branch:cp.branch},
  run:{id:12,path:'.github/workflows/paris-code-repair.yml',event:'workflow_dispatch',head_branch:'main',status:'completed',conclusion:'failure'},
  repair:{id:repairId,actor_id:'owner',goal,status:'blocked',error_code:'PARIS_OPENHANDS_EXECUTION_FAILED',attempt_count:1,
   attempt_history:[{event:'preserved'}],workflow_run_id:12,release_sha:null,candidate:{kind:'openhands-checkpoint',checkpoint:cp},verification:{prior:'preserved'}}};
 const forbidden=async()=>{throw Error('must never start, save, or retry')};
 h.observe=()=>observeAcceptedOpenHandsRepair({repairId,actorId:'owner',attempt:1,runId:12,goal,checkpoint:cp},{
  now:()=>now,save:forbidden,dispatch:forbidden,ensureBranch:forbidden,mainSha:forbidden,
  findTask:async()=>task,refresh:async()=>{h.refreshes++;return {task,lifecycle:h.lifecycle}},
  readCandidate:async()=>{h.reads++;return candidate}});
 h.supervise=()=>superviseAcceptedOpenHandsRepair(h.repair,{now:()=>now,workflow:async()=>h.run,
  sourceEligible:async()=>h.eligible,observe:h.observe,record:async value=>h.records.push(value),
  claim:async value=>{h.claims.push(value);return h.claimWins}});
 return h;
}
test('an expired prepare can observe the SAME running provider without starts or candidate admission',async()=>{
 const h=fixture();assert.deepEqual(await h.observe(),{state:'pending',taskId:'task'});assert.equal(h.refreshes,1);assert.equal(h.reads,0);
 assert.equal(h.cp.startedAt,1);assert.equal(h.cp.sequence,3);
});
test('terminal output after timeout goes through trusted candidate readback',async()=>{
 const h=fixture();h.lifecycle.status='completed';assert.deepEqual(await h.observe(),{state:'ready',taskId:'task',candidate:h.candidate});assert.equal(h.reads,1);
});
test('a historical false failure may be read but actual provider failure remains failed',async()=>{
 const h=fixture();h.task.status='failed';h.lifecycle.status='failed';assert.equal((await h.observe()).state,'failed');assert.equal(h.reads,0);
});
for(const [name,mutate] of [
 ['wrong owner',h=>h.task.user_id='other'],['wrong command',h=>h.task.command+=' changed'],
 ['wrong correlation',h=>h.task.correlation_id='other'],['wrong checkpoint run',h=>h.cp.runId=13],
 ['missing receipt',h=>h.task.tool_output={}],['approval required',h=>h.task.requires_approval=true],
 ['pending approval',h=>h.task.approval_status='pending'],['changed task id',h=>h.cp.taskId='other'],
 ['wrong goal',h=>h.cp.goalHash='changed'],['wrong attempt',h=>h.cp.attempt=2],
 ])test(`${name} prevents even the provider refresh`,async()=>{
 const h=fixture();mutate(h);await assert.rejects(h.observe());assert.equal(h.refreshes,0);assert.equal(h.reads,0);
 });
test('changed start receipt and wrong terminal branch cannot admit a candidate',async()=>{
 for(const mutate of [h=>h.lifecycle.startTaskId='new-start',h=>h.lifecycle.branch='main',h=>h.lifecycle.repository='other/repo']){
 const h=fixture();h.lifecycle.status='completed';mutate(h);await assert.rejects(h.observe());assert.equal(h.reads,0);
 }
});
test('a previously approved canonical task does not request redundant approval',async()=>{
 const h=fixture();h.task.approval_status='approved';
 assert.deepEqual(await h.observe(),{state:'pending',taskId:'task'});
 assert.equal(h.refreshes,1);assert.equal(h.reads,0);
});
test('an approval still pending or provider-required never advances',async()=>{
 for(const mutate of [h=>h.task.approval_status='pending',h=>h.task.requires_approval=true,h=>h.task.status='awaiting_approval']){
  const h=fixture();mutate(h);await assert.rejects(h.observe(),/APPROVAL_REQUIRED/);assert.equal(h.refreshes,0);
 }
});
test('approval requested by provider is retained',async()=>{
 const h=fixture();h.lifecycle.status='approval_required';await assert.rejects(h.observe(),/APPROVAL_REQUIRED/);assert.equal(h.reads,0);
});
test('monitor saves safe pending evidence while preserving the blocked record and attempt',async()=>{
 const h=fixture();assert.equal((await h.supervise()).awaitingProvider,true);assert.equal(h.claims.length,0);
 assert.equal(h.records[0].prior,'preserved');assert.equal(h.records[0].openhandsObservation.state,'pending');assert.equal(h.repair.attempt_count,1);
});
test('terminal committed result re-enters independent validation with original history and SAME attempt',async()=>{
 const h=fixture();h.lifecycle.status='completed';const result=await h.supervise();
 assert.equal(result.dispatchRequired,true);assert.equal(result.repairId,repairId);assert.equal(h.claims.length,1);
 const claim=h.claims[0];assert.equal(claim.status,'dispatched');assert.equal(claim.workflow_run_id,null);
 assert.equal(claim.candidate,h.candidate);assert.equal('attempt_count' in claim,false);assert.equal('release_sha' in claim,false);
 assert.equal(claim.attempt_history[0].event,'preserved');assert.deepEqual(claim.attempt_history[1].checkpoint,h.cp);
 assert.equal(claim.verification.prior,'preserved');
});
test('lost compare-and-swap never requests another workflow',async()=>{
 const h=fixture();h.lifecycle.status='completed';h.claimWins=false;assert.equal((await h.supervise()).dispatchRequired,undefined);
});
for(const mutate of [h=>h.run.conclusion='cancelled',h=>h.run.conclusion='success',h=>h.run.path='other.yml',h=>h.run.id=13,
 h=>h.run.head_branch='feature',h=>h.run.event='push',h=>h.eligible=false])test('ineligible source or original workflow cannot refresh or promote work',async()=>{
 const h=fixture();mutate(h);await h.supervise();assert.equal(h.refreshes,0);assert.equal(h.claims.length,0);
});
test('active original workflow retains ownership',async()=>{
 const h=fixture();h.run.status='in_progress';await h.supervise();assert.equal(h.records.length,0);assert.equal(h.refreshes,0);
});
test('observation is bounded to 24h and cannot reset the original deadline',async()=>{
 const h=fixture();h.cp.startedAt=now-25*60*60_000;await h.supervise();assert.equal(h.records[0].openhandsObservation.state,'attention_required');assert.equal(h.refreshes,0);
});
test('actual terminal failure is recorded without another provider execution or workflow',async()=>{
 const h=fixture();h.lifecycle.status='failed';await h.supervise();assert.equal(h.records[0].openhandsObservation.state,'failed');assert.equal(h.claims.length,0);
});
test('ambiguous transport stays unverified and never admits a candidate',async()=>{
 const h=fixture();h.observe=()=>{throw Error('PARIS_OPENHANDS_GITHUB_HTTP_503')};
 const result=await h.supervise();assert.equal(result.awaitingProvider,true);assert.equal(h.records[0].openhandsObservation.state,'unverified');assert.equal(h.claims.length,0);
});
test('internal, published, approval-blocked and exhausted-without-receipt repairs are excluded',()=>{
 for(const mutate of [h=>h.repair.status='verified',h=>h.repair.release_sha='b'.repeat(40),h=>h.repair.candidate.kind='planner-checkpoint',
 h=>h.repair.error_code='PARIS_OPENHANDS_APPROVAL_REQUIRED',h=>delete h.cp.taskId,h=>h.repair.verification.openhandsObservation={state:'failed'}]){
 const h=fixture();mutate(h);assert.equal(Boolean(acceptedOpenHandsNeedsObservation(h.repair)),false);
 }
});

test('a source that pauses during terminal readback cannot be claimed',async()=>{
 const h=fixture();h.lifecycle.status='completed';let checks=0;
 const result=await superviseAcceptedOpenHandsRepair(h.repair,{now:()=>now,workflow:async()=>h.run,
  sourceEligible:async()=>++checks===1,observe:h.observe,record:async value=>h.records.push(value),
  claim:async value=>{h.claims.push(value);return true}});
 assert.equal(result.dispatchRequired,undefined);assert.equal(h.claims.length,0);assert.equal(checks,2);
 assert.equal(h.records[0].openhandsObservation.state,'source_ineligible');
});
