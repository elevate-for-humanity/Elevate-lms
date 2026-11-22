import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {isProviderConfirmationSnapshot} from '../../lib/devstudio/openhands/provider-confirmation.mjs';

const taskId = '06a8492f-9792-479a-8274-70cd9728dc44';
const owner = 'owner';
const task = () => ({
  id: taskId, user_id: owner, tenant_id: null, tool_name: 'openhands.execute',
  status: 'awaiting_approval', requires_approval: true, approval_status: 'pending',
  approval_reason: 'OpenHands is waiting for confirmation. Elevate retains approval authority.',
  correlation_id: 'paris-repair:11111111-1111-4111-8111-111111111111:attempt:1',
  tool_input: {repository: 'elevate-for-humanity/Elevate-lms', branch: 'studio/paris-openhands-11111111-1111-4111-8111-111111111111-1'},
  tool_output: {start_task_id: 'original-start'}, trace_id: 'trace',
});
function harness(input = task()) {
  const writes = []; let dispatches = 0;
  const db = {from(table) {
    const state = {table, filters: {}, mutation: null};
    const q = {
      select() {return q;},
      eq(k,v) {state.filters[k] = v; return q;},
      update(value) {state.mutation = value; return q;},
      async single() {assert.equal(table,'ai_tasks'); return {data: input};},
      async maybeSingle() {
        if (table === 'ai_approvals') {
          assert.equal(state.filters.task_id,taskId);
          assert.equal(state.filters.status,'pending');
          writes.push({table, mutation: state.mutation});
          return {data:{id:'approval'}};
        }
        assert.equal(table,'ai_tasks');
        for (const [key,value] of Object.entries(state.filters)) {
          if (key === 'status' || key === 'approval_status') assert.equal(input[key],value);
        }
        writes.push({table, mutation: state.mutation});
        return {data:{id:taskId}};
      }
    };
    return q;
  }};
  const src = readFileSync(new URL('../../lib/devstudio/os/task-runner.ts', import.meta.url), 'utf8');
  const start = src.indexOf('export async function approveTask(');
  const end = src.indexOf('export async function recoverStaleAiTasks(', start);
  assert.ok(start >= 0 && end > start);
  const code = stripTypeScriptTypes(src.slice(start,end)).replace('export async function','async function');
  const approve = new Function('isProviderConfirmationSnapshot','writeDevAuditLog','appendTaskLog','reconcileTaskProjection','runTaskExecution', code+';return approveTask;')(
    isProviderConfirmationSnapshot,
    async (_db,data) => writes.push({table:'audit',mutation:data}),
    async () => writes.push({table:'log'}),
    async () => writes.push({table:'projection'}),
    async () => {dispatches++; throw Error('GENERIC EXECUTOR MUST NOT RUN');}
  );
  return {approve: id => approve(db, taskId, id, {actorRoles:['admin']}), writes, dispatches:()=>dispatches};
}

test('owner approval authorizes original OpenHands receipt without re-dispatch',async()=>{
  const h = harness();
  await h.approve(owner);
  assert.deepEqual(h.writes.slice(0,2).map(x=>x.table),['ai_approvals','ai_tasks']);
  assert.equal(h.writes[1].mutation.status,'running');
  assert.equal(h.writes[1].mutation.approval_status,'approved');
  assert.equal(h.writes.some(x=>x.table==='audit'),true);
  assert.equal(h.dispatches(),0);
});
test('wrong owner, missing receipt and altered approval reason are rejected without mutation',async()=>{
  for(const invalid of [
    [task(),'other-owner'],
    [{...task(),tool_output:{}},owner],
    [{...task(),approval_reason:'Different approval'},owner],
    [{...task(),approval_status:'rejected'},owner],
  ]){
    const h=harness(invalid[0]);
    await assert.rejects(h.approve(invalid[1]),/OPENHANDS_APPROVAL_RECEIPT_OR_OWNER_MISMATCH|GENERIC EXECUTOR MUST NOT RUN/);
    assert.equal(h.writes.length,0);
    assert.equal(h.dispatches(),0);
  }
});
