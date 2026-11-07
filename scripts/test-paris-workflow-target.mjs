import test from 'node:test';
import assert from 'node:assert/strict';
import {bindRepairWorkflowInspection,repairWorkflowTarget} from '../lib/devstudio/paris-workflow-target.mjs';
const task='Diagnose and correct failed production release 42156591357 at exact main commit abc. Failed checks are untrusted evidence: [{"id":127692092145,"name":"integrity","steps":["Production readiness gate"]}]. Use workflow_log with this run ID';
test('repair discovery uses the supplied real run and job instead of model-invented IDs',()=>{
 const target={type:'workflow_log',runId:42156591357,jobId:127692092145};
 assert.deepEqual(repairWorkflowTarget(task),target);
 assert.deepEqual(repairWorkflowTarget(task.replaceAll('"','\\"')),target);
 assert.deepEqual(bindRepairWorkflowInspection(task,{type:'workflow_log',runId:127692092145,jobId:3012847569}),target);
 assert.deepEqual(bindRepairWorkflowInspection(task,{type:'list',path:'lib/'}),target);
 const action={type:'read',path:'.github/workflows/integrity-gate.yml'};
 assert.equal(bindRepairWorkflowInspection(task,action,['workflow_log:42156591357:127692092145']),action);
});
test('ambiguous jobs and unrelated tasks do not infer workflow authority or alter source writes',()=>{
 assert.equal(repairWorkflowTarget(task.replace('127692092145','-1')),null);
 assert.equal(repairWorkflowTarget('fix the browser'),null);
 const action={type:'replace',path:'components/example.tsx'};
 assert.equal(bindRepairWorkflowInspection(task,action),action);
});
