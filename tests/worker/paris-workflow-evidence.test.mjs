import test from 'node:test';
import assert from 'node:assert/strict';
import {failedWorkflowLogExcerpt} from '../../lib/devstudio/paris-workflow-evidence.mjs';
import {checkInspectionBudget} from '../../lib/devstudio/paris-inspection-budget.mjs';

test('failed workflow evidence preserves the actual failing assertion and hides credentials',()=>{
 const log=[
  'step setup',
  'Authorization: Bearer very-sensitive-token',
  'token=secret-value',
  'assertion failed: expected natural voice service',
  '##[error]Process completed with exit code 1.',
  'unrelated cleanup',
 ].join('\n');
 const excerpt=failedWorkflowLogExcerpt(log);
 assert.match(excerpt,/assertion failed: expected natural voice service/);
 assert.match(excerpt,/Process completed with exit code 1/);
 assert.doesNotMatch(excerpt,/very-sensitive-token|secret-value/);
});
test('workflow log evidence is bounded',()=>{
 const excerpt=failedWorkflowLogExcerpt('line\n'.repeat(10000)+'##[error] test failed',1200);
 assert.ok(excerpt.length<=1200);
 assert.match(excerpt,/test failed/);
});
test('repeated workflow job-log inspections are bounded per exact run and job',()=>{
 const action={type:'workflow_log',runId:123,jobId:456};
 const first=checkInspectionBudget([],action);
 assert.equal(first.decision,'inspect');
 assert.equal(checkInspectionBudget([first.key],action).decision,'redirect');
 assert.equal(checkInspectionBudget([first.key,first.key],action).decision,'stop');
 assert.equal(checkInspectionBudget([first.key],{...action,jobId:457}).decision,'inspect');
});

test('workflow log execution requires failed job on exact main and retains only read authority',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
 assert.match(source,/run\.head_branch!=='main'/);
 assert.match(source,/run\.head_sha!==baseSha/);
 assert.match(source,/run\.conclusion!=='failure'/);
 assert.match(source,/item\.run_id===action\.runId/);
 assert.match(source,/item\.conclusion==='failure'/);
 assert.match(source,/failedWorkflowLogExcerpt\(body\)/);
});
