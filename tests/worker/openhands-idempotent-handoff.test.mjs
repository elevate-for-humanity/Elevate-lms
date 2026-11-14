import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const source=readFileSync(new URL('../../lib/devstudio/openhands/runtime.ts',import.meta.url),'utf8');

test('known OpenHands correlation returns the original receipt without an external start',async()=>{
 const fn=source.slice(source.indexOf('function reuseCorrelatedOpenHandsTask('),source.indexOf('function lifecycleTaskStatus('));
 const code=stripTypeScriptTypes(fn).replaceAll('export ','');
 const input={actorId:'owner',task:'original command',repository:'owner/repo',branch:'owned',correlationId:'original'};
 const existing={id:'canonical-task',tool_name:'openhands.execute',user_id:'owner',tenant_id:null,
  tool_input:{repository:input.repository,branch:input.branch},command:input.task,status:'running',
  tool_output:{start_task_id:'original-start',conversation_id:'original-conversation'}};
 let starts=0,reads=0;
 const dispatch=new Function('requireAdminClient','findExistingTask','startOpenHandsTask',code+';return dispatchOpenHandsTask;')(
  async()=>({}),async correlation=>{reads++;assert.equal(correlation,'original');return existing;},
  async()=>{starts++;throw Error('duplicate start');});
 for(let n=0;n<2;n++)assert.deepEqual(await dispatch(input),{taskId:'canonical-task',startTaskId:'original-start',
  conversationId:'original-conversation',status:'running'});
 assert.equal(reads,2);assert.equal(starts,0);
});
test('an ambiguous prior start fails closed, never replays work',()=>{
 assert.match(source,/OPENHANDS_EXISTING_TASK_START_UNCONFIRMED/);
 assert.match(source,/OPENHANDS_CORRELATION_OWNERSHIP_MISMATCH/);
 assert.match(source,/OPENHANDS_EXISTING_TASK_NOT_DISPATCHABLE/);
 assert.match(source,/existing\.user_id !== input\.actorId/);
 assert.match(source,/existing\.command !== input\.task/);
});
