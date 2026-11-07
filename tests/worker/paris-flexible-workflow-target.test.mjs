import test from 'node:test';
import assert from 'node:assert/strict';
import {bindVerifiedFailedWorkflowInspection,repairWorkflowRunHint} from '../../lib/devstudio/paris-workflow-target.mjs';

const runId=41920417830;
const fail={head_branch:'main',status:'completed',conclusion:'failure'};
const jobs={total_count:2,jobs:[{id:128397380474,run_id:runId,conclusion:'failure'},{id:128397381254,run_id:runId,conclusion:'success'}]};
const discovery={type:'search',query:'store deployment failed'};

test('natural language deployment reference without job ID resolves a real failed job',async()=>{
  assert.equal(repairWorkflowRunHint('Diagnose failed production release 41920417830.'),runId);
  const bound=await bindVerifiedFailedWorkflowInspection('Fix failed production release 41920417830',discovery,[],
    async id=>{assert.equal(id,runId);return fail;},
    async id=>{assert.equal(id,runId);return jobs;});
  assert.deepEqual(bound,{type:'workflow_log',runId,jobId:128397380474});
});

test('alternative run wording works without the old exact failed-checks prose',async()=>{
  assert.equal(repairWorkflowRunHint('Investigate workflow run #41920417830 for Store'),runId);
  const bound=await bindVerifiedFailedWorkflowInspection('Investigate workflow run #41920417830',discovery,[],
    async()=>fail,async()=>jobs);
  assert.equal(bound.jobId,128397380474);
});

test('multiple failed jobs, no run ID and unrelated writes never fabricate job authority',async()=>{
  assert.equal(repairWorkflowRunHint('Fix Store deployment'),null);
  assert.equal(await bindVerifiedFailedWorkflowInspection('Fix Store deployment',discovery,[],async()=>{throw Error('called')},async()=>jobs),discovery);
  const ambiguous={total_count:2,jobs:[...jobs.jobs.slice(0,1),{id:128397381254,run_id:runId,conclusion:'failure'}]};
  assert.equal(await bindVerifiedFailedWorkflowInspection('Failed production release 41920417830',discovery,[],async()=>fail,async()=>ambiguous),discovery);
  const write={type:'replace',path:'lib/safe.ts',old:'a',replacement:'b'};
  assert.equal(await bindVerifiedFailedWorkflowInspection('Failed production release 41920417830',write,[],async()=>fail,async()=>jobs),write);
});

test('historical missing runs do not fail other tasks; authorization problems still fail',async()=>{
  assert.equal(await bindVerifiedFailedWorkflowInspection('Failed production release 41920417830',discovery,[],
    async()=>{throw Error('GitHub API 404 for /actions/runs');},async()=>jobs),discovery);
  await assert.rejects(bindVerifiedFailedWorkflowInspection('Failed production release 41920417830',discovery,[],
    async()=>{throw Error('GitHub API 401');},async()=>jobs),/401/);
});

test('only one authenticated failed job binds, and it is not re-read',async()=>{
  const history=['workflow_log:41920417830:128397380474'];
  assert.equal(await bindVerifiedFailedWorkflowInspection('Failed production release 41920417830',discovery,history,async()=>fail,async()=>jobs),discovery);
});
