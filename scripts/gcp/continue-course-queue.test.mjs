import test from 'node:test';
import assert from 'node:assert/strict';
import { continueCourseQueue, courseReleasePending } from './continue-course-queue.mjs';
test('observes active rendering through an empty scan until the next lesson is assigned',async()=>{
 const states=[{status:'empty',activeExecutions:1},{status:'empty',activeExecutions:1},{status:'assigned'},{status:'empty',activeExecutions:0}];
 let clock=0,calls=0;
 const result=await continueCourseQueue({dispatch:async()=>{calls++;return states.shift();},now:()=>clock,delay:async ms=>{clock+=ms;},onState:()=>{}});
 assert.equal(result.status,'empty');assert.equal(calls,4);
});
test('active rendering beyond the coordinator budget gets one trusted successor',async()=>{
 let handoffs=0;
 const result=await continueCourseQueue({dispatch:async()=>({status:'empty',activeExecutions:1}),budgetMs:0,onState:()=>{},
 env:{GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',GH_TOKEN:'test'},request:async()=>{handoffs++;return {status:204};}});
 assert.equal(result.status,'handed_off');assert.equal(handoffs,1);
});
test('capacity waits still terminate without spinning or dispatching a successor',async()=>{
 const result=await continueCourseQueue({dispatch:async()=>({status:'capacity_wait'}),request:async()=>{throw Error('must not dispatch');},onState:()=>{}});
 assert.equal(result.status,'capacity_wait');
});
test('continues after a running task and fresh claim, then stops without dispatching an empty queue', async () => {
  const states = ['busy', 'assigned', 'busy', 'empty']; let clock = 0, handoffs = 0;
  const result = await continueCourseQueue({ dispatch: async () => ({ status: states.shift() }), now: () => clock,
    delay: async ms => { clock += ms; }, request: async () => { handoffs++; }, onState: () => {} });
  assert.equal(result.status, 'empty'); assert.equal(handoffs, 0);
});
test('hands remaining eligible work to one bounded trusted-main successor', async () => {
  let clock = 0; const calls = [];
  const result = await continueCourseQueue({ dispatch: async () => ({ status: 'busy' }), now: () => clock,
    delay: async ms => { clock += ms; }, budgetMs: 30_000, onState: () => {},
    env: { GITHUB_REPOSITORY: 'elevate-for-humanity/Elevate-lms', GH_TOKEN: 'test' },
    request: async (url, options) => { calls.push({ url, options }); return { status: 204 }; } });
  assert.equal(result.status, 'handed_off'); assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(calls[0].options.body), { ref: 'main' });
});
test('does not certify or hand off when the dispatcher or acknowledgment fails', async () => {
  await assert.rejects(continueCourseQueue({ dispatch: async () => { throw Error('queue unavailable'); }, onState: () => {} }), /queue unavailable/);
  await assert.rejects(continueCourseQueue({ dispatch: async () => ({ status: 'busy' }), budgetMs: 0,
    env: { GITHUB_REPOSITORY: 'elevate-for-humanity/Elevate-lms', GH_TOKEN: 'test' },
    request: async () => ({ status: 403 }), onState: () => {} }), /HANDOFF_HTTP_403/);
});
test('no credential or wrong repository cannot schedule a successor', async () => {
  await assert.rejects(continueCourseQueue({ dispatch: async () => ({ status: 'busy' }), budgetMs: 0,
    env: {}, onState: () => {} }), /DISPATCH_AUTHORITY_REQUIRED/);
});

test('pending worker deployment yields the lane without launching work or replacing its queue slot',async()=>{
 let dispatches=0,handoffs=0;
 const result=await continueCourseQueue({releasePending:async()=>true,dispatch:async()=>{dispatches++;},request:async()=>{handoffs++;}});
 assert.equal(result.status,'yielded_for_release');assert.equal(dispatches,0);assert.equal(handoffs,0);
});
test('release inventory uses actual main worker runs and fails closed on an unreadable inventory',async()=>{
 const env={GITHUB_REPOSITORY:'elevate-for-humanity/Elevate-lms',GH_TOKEN:'test'};
 assert.equal(await courseReleasePending({env,request:async()=>({ok:true,json:async()=>({workflow_runs:[{head_branch:'main',status:'in_progress'}]})})}),true);
 assert.equal(await courseReleasePending({env,request:async()=>({ok:true,json:async()=>({workflow_runs:[{head_branch:'main',status:'completed'},{head_branch:'untrusted',status:'queued'}]})})}),false);
 assert.equal(await courseReleasePending({env,request:async()=>({ok:true,json:async()=>({workflow_runs:[{head_branch:'main',status:'queued'}]})})}),false);
 await assert.rejects(courseReleasePending({env,request:async()=>({ok:false,status:403})}),/HTTP_403/);
});
