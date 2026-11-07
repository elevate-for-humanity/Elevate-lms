import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectWorkflow,auditWorkflowSources} from './github-workflow-gates.mjs';
test('orphan cron is detected without modifying workflow',()=>{
 const row=inspectWorkflow('legacy.yml',"on:\n  schedule:\n    - cron: '*/30 * * * *'\njobs:\n  other:\n    if: github.event_name == 'workflow_dispatch'\n    runs-on: ubuntu-latest\n");
 assert.ok(row.findings.some(x=>x.code==='ORPHAN_CRON'));
});
test('matching cron and jobs are inventoried without false alarm',()=>{
 const row=inspectWorkflow('healthy.yml',"on:\n  schedule:\n    - cron: '*/5 * * * *'\njobs:\n  dispatcher:\n    if: github.event.schedule == '*/5 * * * *'\n    runs-on: ubuntu-latest\n");
 assert.equal(row.job_count,1);assert.equal(row.findings.length,0);
});
test('hardcoded legacy source gates and disabled jobs are detected',()=>{
 const row=inspectWorkflow('bad.yml',"jobs:\n  dispatch:\n    if: github.event_name == 'push' && false\n    runs-on: ubuntu-latest\n  resume:\n    if: github.event.workflow_run.head_sha == '"+'a'.repeat(40)+"'\n    runs-on: ubuntu-latest\n");
 assert.ok(row.findings.some(x=>x.code==='PERMANENTLY_SKIPPED_JOB'));
 assert.ok(row.findings.some(x=>x.code==='HISTORICAL_SHA_GATE'));
});
test('full workflow inventory includes more than a handful of workflow definitions',()=>{
 const result=auditWorkflowSources();
 assert.ok(result.files>=200);
 assert.ok(result.jobs>=100);
 assert.equal(result.workflows.length,result.files);
});
