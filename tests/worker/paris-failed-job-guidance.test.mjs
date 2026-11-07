import test from 'node:test';
import assert from 'node:assert/strict';
import {failedWorkflowJobGuidance} from '../../lib/devstudio/paris-workflow-evidence.mjs';

test('wrong planner job ID redirects to exact failed job without relaxing evidence gate',()=>{
  const jobs=[
    {id:12,run_id:100,name:'prepare',conclusion:'success'},
    {id:13,run_id:100,name:'validate',conclusion:'failure'},
    {id:14,run_id:101,name:'foreign-failure',conclusion:'failure'},
    {id:15,run_id:100,name:'publish',conclusion:'skipped'},
  ];
  const response=failedWorkflowJobGuidance(jobs,100,12);
  assert.match(response,/WORKFLOW_LOG_FAILED_JOB_REQUIRED/);
  assert.match(response,/"jobId":13/);
  assert.doesNotMatch(response,/"jobId":14/);
  assert.doesNotMatch(response,/"jobId":12/);
  assert.doesNotMatch(response,/"jobId":15/);
});
test('when no failed job is verified, planner must inspect current source',()=>{
  const response=failedWorkflowJobGuidance([{id:11,run_id:1,conclusion:'success'}],1,11);
  assert.match(response,/Verified failed jobs: \[\]/);
  assert.match(response,/inspect current source/);
});
