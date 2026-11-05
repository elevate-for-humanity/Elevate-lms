import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runtime=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
const endpoint=readFileSync(new URL('../../apps/admin/app/api/cron/paris-code-repair/route.ts',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../../.github/workflows/paris-code-repair.yml',import.meta.url),'utf8');

test('unconfirmed dispatch is recorded without clearing retry attempts',()=>{
 const handler=runtime.slice(runtime.indexOf('export async function reportParisDispatchFailure'),
                            runtime.indexOf('export async function reportParisRepairFailure'));
 assert.match(handler,/status:'blocked'/);
 assert.match(handler,/REPAIR_DISPATCH_FAILED_UNCONFIRMED/);
 assert.match(handler,/\.eq\('status','dispatched'\)/);
 assert.match(handler,/\.is\('workflow_run_id',null\)/);
 assert.doesNotMatch(handler,/attempt_count\s*:/);
 assert.doesNotMatch(handler,/status:'queued'/);
 assert.match(handler,/retryAuthorized:false/);
});

test('failure receipt accepts signed workflow authority, not anonymous requests',()=>{
 assert.match(endpoint,/if\(body.phase==='dispatch-failure'\)/);
 assert.match(endpoint,/withWorkflowGitHubToken\(token/);
 assert.match(endpoint,/reportParisDispatchFailure\(body.repairId\)/);
});

test('monitor reports failed GitHub dispatch and does not replay the POST',()=>{
 assert.match(workflow,/except subprocess\.CalledProcessError:/);
 assert.match(workflow,/'phase':'dispatch-failure'/);
 assert.match(workflow,/urllib\.request\.urlopen\(failure_req,timeout=30\)/);
});
