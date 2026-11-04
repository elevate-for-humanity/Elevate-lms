import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canDispatchParisRepairAttempt} from './code-repair-policy.mjs';

const sourceFree=(attempt_count,reason)=>({
 attempt_count,source_job_id:null,attempt_history:reason?[{retryReason:reason}]:[]
});

test('default PARIS repairs can dispatch only the first two attempts',()=>{
 assert.equal(canDispatchParisRepairAttempt(sourceFree(0)),true);
 assert.equal(canDispatchParisRepairAttempt(sourceFree(1)),true);
 assert.equal(canDispatchParisRepairAttempt(sourceFree(2)),false);
 assert.equal(canDispatchParisRepairAttempt(sourceFree(3)),false);
});
test('a third source-free attempt needs exact recorded bounded recovery history',()=>{
 for(const reason of ['bounded-context-budget-recovery','bounded-cpu-edit-recovery']){
   assert.equal(canDispatchParisRepairAttempt(sourceFree(2,reason)),true);
   assert.equal(canDispatchParisRepairAttempt(sourceFree(3,reason)),false);
 }
 assert.equal(canDispatchParisRepairAttempt(sourceFree(2,'verified-owned-provider-recovery')),false);
});
test('source-linked course repairs cannot use third-attempt exceptions',()=>{
 assert.equal(canDispatchParisRepairAttempt({...sourceFree(2,'bounded-context-budget-recovery'),source_job_id:'job'}),false);
 assert.equal(canDispatchParisRepairAttempt({...sourceFree(2,'bounded-cpu-edit-recovery'),source_job_id:'job'}),false);
});
test('bad/missing counter and corrupt recovery metadata are rejected',()=>{
 for(const attempt_count of [null,-1,2.5,'bad',4]){
   assert.equal(canDispatchParisRepairAttempt({attempt_count,source_job_id:null,attempt_history:[]}),false);
 }
 assert.equal(canDispatchParisRepairAttempt({attempt_count:2,source_job_id:null,attempt_history:null}),false);
});
test('reviewed migration matches dispatch precondition without changing historical retries',()=>{
 const sql=readFileSync('supabase/migrations/20261104213200_paris_bounded_context_retry_contract.sql','utf8');
 assert.match(sql,/attempt_count BETWEEN 0 AND 2/i);
 assert.match(sql,/attempt_count = 3/i);
 assert.match(sql,/source_job_id IS NULL/i);
 assert.match(sql,/bounded-context-budget-recovery/);
 assert.match(sql,/bounded-cpu-edit-recovery/);
 assert.doesNotMatch(sql,/UPDATE\s+public\.paris_code_repairs/i);
});
