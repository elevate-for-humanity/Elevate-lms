import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openHandsRepairPrompt, observeAcceptedOpenHandsRepair, prepareOpenHandsRepair} from '../../lib/devstudio/paris-openhands-repair.mjs';

const repairId='11111111-1111-4111-8111-111111111111';
const actorId='authorized-owner', attempt=1, runId=12, goal='Repair a confirmed infrastructure workflow failure';
const baseSha='a'.repeat(40);
const branch=`studio/paris-openhands-${repairId}-1`;
const correlationId=`paris-repair:${repairId}:attempt:1`;
const identity={repairId,actorId,attempt,runId,goal};
const promptArgs={goal,repairId,branch,baseSha};
const legacyAllowed='Allowed roots: lib/, components/, apps/, remotion-src/, workers/, tests/; also .github/workflows/*.yml, Dockerfile.admin/lms/marketing and scripts/gcp/*.mjs or *.py.';

test('historical prompt is stable and the new prompt never offers paths rejected by protected-path validation',()=>{
  const legacy=openHandsRepairPrompt(promptArgs);
  assert.ok(legacy.includes(legacyAllowed));
  assert.equal(openHandsRepairPrompt({...promptArgs,promptVersion:1}),legacy);
  const next=openHandsRepairPrompt({...promptArgs,promptVersion:2});
  assert.doesNotMatch(next,/also \.github\/workflows\/\*\.yml/);
  assert.match(next,/\.github\/, scripts\/, Dockerfile\*/);
  assert.match(next,/report the blocker/);
  assert.match(next,/Do not merge, deploy/);
  assert.throws(()=>openHandsRepairPrompt({...promptArgs,promptVersion:3}),/PROMPT_VERSION_INVALID/);
});

test('historical accepted OpenHands task is observed with exact original command and never re-dispatched',async()=>{
  const cp={version:1,repairId,actorId,attempt,runId,branch,baseSha,correlationId,
    goalHash:createHash('sha256').update(goal).digest('hex'),
    startedAt:1000,sequence:3,branchPrepared:true,dispatchRequested:true,taskId:'original-task'};
  const task={id:cp.taskId,tool_name:'openhands.execute',user_id:actorId,tenant_id:null,
    correlation_id:correlationId,command:openHandsRepairPrompt(promptArgs),
    tool_input:{repository:'elevate-for-humanity/Elevate-lms',branch},
    tool_output:{start_task_id:'original-provider-start'},requires_approval:false,
    approval_status:'not_required',status:'completed'};
  const deps={findTask:async()=>task,refresh:async()=>({task,lifecycle:{status:'completed',
    startTaskId:'original-provider-start',repository:'elevate-for-humanity/Elevate-lms',branch}}),
    readCandidate:async()=>({proof:'same-task'})};
  assert.deepEqual(await observeAcceptedOpenHandsRepair({...identity,checkpoint:cp},deps),
    {state:'ready',taskId:'original-task',candidate:{proof:'same-task'}});
  const changed={...task,command:openHandsRepairPrompt({...promptArgs,promptVersion:2})};
  await assert.rejects(observeAcceptedOpenHandsRepair({...identity,checkpoint:cp},
    {...deps,findTask:async()=>changed}),/TASK_OWNERSHIP_MISMATCH/);
});

test('new repair pins v2 before dispatch and cannot drift to historical command on resume',async()=>{
  let checkpoint=null,dispatches=0,task=null;
  const deps={
    now:()=>1000,mainSha:async()=>baseSha,ensureBranch:async()=>{},
    save:async(next,expected)=>{
      assert.equal(expected,checkpoint?.sequence??null);
      checkpoint=structuredClone(next);
    },
    findTask:async()=>task,
    dispatch:async(request)=>{
      dispatches++;
      assert.equal(checkpoint.promptVersion,2);
      assert.equal(checkpoint.dispatchRequested,true);
      assert.match(request.task,/report the blocker/);
      task={id:'new-task',tool_name:'openhands.execute',user_id:actorId,
        tenant_id:null,correlation_id:correlationId,command:request.task,
        tool_input:{repository:request.repository,branch:request.branch},
        tool_output:{start_task_id:'same-start'},requires_approval:false,
        approval_status:'not_required',status:'running'};
      return {taskId:'new-task',startTaskId:'same-start'};
    },
    refresh:async()=>({task,lifecycle:{status:'running'}})
  };
  assert.equal((await prepareOpenHandsRepair(identity,deps)).pending,true);
  assert.equal((await prepareOpenHandsRepair({...identity,checkpoint},deps)).pending,true);
  assert.equal(dispatches,1);
  await assert.rejects(prepareOpenHandsRepair({...identity,checkpoint:{...checkpoint,promptVersion:1}},deps),
    /CHECKPOINT_OWNERSHIP_MISMATCH/);
  assert.equal(dispatches,1);
});
