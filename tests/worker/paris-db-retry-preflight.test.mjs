import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
test('PARIS skips only unverified context third attempts without burning retry state',()=>{
 const begin=source.indexOf('const contextOnlyThirdAttempt=');
 const end=source.indexOf('if(!canDispatchParisRepairAttempt(candidate))',begin);
 assert.ok(begin>0&&end>begin);
 const guard=source.slice(begin,end);
 assert.match(guard,/candidate.attempt_count===2/);
 assert.match(guard,/candidate.source_job_id==null/);
 assert.match(guard,/bounded-context-budget-recovery/);
 assert.match(guard,/bounded-cpu-edit-recovery/);
 assert.match(guard,/PARIS_BOUNDED_CONTEXT_DB_READY!=='true'/);
 assert.match(guard,/continue/);
 assert.doesNotMatch(guard,/\.update\(/);
});
