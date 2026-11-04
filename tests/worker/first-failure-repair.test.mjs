import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isTransientCourseFailure,requestFirstFailureRepair} from '../../lib/ultimate-course-builder/worker/first-failure-repair.mjs';

test('caption, narration and learner failures require repair on the first occurrence',()=>{
 for(const message of ['captions do not cover rendered narration','MEDIA_SCENE_NARRATION_MISMATCH:scene:0.741','Authenticated learner check failed: resume'])
  assert.equal(isTransientCourseFailure([{message}]),false);
 assert.equal(isTransientCourseFailure([{message:'HTTP 503'}]),true);
 assert.equal(isTransientCourseFailure([{message:'HTTP 503'},{message:'captions missing'}]),false);
 assert.equal(isTransientCourseFailure([]),false);
});

test('durable repair receipt and source correlation precede immediate PARIS wakeup',async()=>{
 const calls=[];
 const db={from(table){
  const result=table==='paris_autopilot_policy'?{data:{enabled:true,actor_id:'owner'}}:
   table==='ultimate_build_jobs'?{data:[{id:'job'}]}:{data:{id:'repair',status:'queued'}};
  const chain={then(resolve){return Promise.resolve(result).then(resolve);}};
  for(const method of ['select','eq','maybeSingle','single','upsert','update'])chain[method]=(...args)=>{calls.push({table,method,args});return chain;};
  return chain;
 }};
 const receipt=await requestFirstFailureRepair({db,job:{id:'job',build_id:'build',execution_generation:7},findings:[{code:'LEARNER_RUNTHROUGH_CHECK_FAILED'}],notify:async input=>{calls.push({wake:input});}});
 assert.equal(receipt.id,'repair');
 assert.equal(calls.at(-1).wake.workflow,'paris-code-repair.yml');
 assert.ok(calls.some(c=>c.method==='upsert'&&c.args[0].source_job_id==='job'&&c.args[1].ignoreDuplicates));
 assert.ok(calls.some(c=>c.method==='update'&&c.args[0].monitor.state==='repairing'));
 assert.ok(calls.some(c=>c.method==='eq'&&c.args[0]==='execution_generation'&&c.args[1]===7));
});
