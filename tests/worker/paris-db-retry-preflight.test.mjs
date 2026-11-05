import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canDispatchParisRepairAttempt} from '../../lib/ai/runtime/code-repair-policy.mjs';

const source=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
const migration=readFileSync(new URL('../../supabase/migrations/20261104213200_paris_bounded_context_retry_contract.sql',import.meta.url),'utf8');

test('PARIS third-attempt preflight follows the reviewed live database migration',()=>{
 assert.match(migration,/bounded-context-budget-recovery/);
 assert.match(migration,/source_job_id IS NULL/);
 assert.match(source,/if\(!canDispatchParisRepairAttempt\(candidate\)\)/);
 assert.doesNotMatch(source,/PARIS_BOUNDED_CONTEXT_DB_READY/);
 const allowed={status:'queued',attempt_count:2,source_job_id:null,
  attempt_history:[{retryReason:'bounded-context-budget-recovery'}]};
 assert.equal(canDispatchParisRepairAttempt(allowed),true);
 assert.equal(canDispatchParisRepairAttempt({...allowed,source_job_id:'course-job'}),false);
 assert.equal(canDispatchParisRepairAttempt({...allowed,attempt_history:[]}),false);
 assert.equal(canDispatchParisRepairAttempt({...allowed,attempt_count:3}),false);
});
