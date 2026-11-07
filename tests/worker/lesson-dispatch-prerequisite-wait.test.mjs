import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchLessonAutopilots} from '../../scripts/gcp/dispatch-lesson-autopilots.mjs';
import {LESSON_ROLE_JOBS} from '../../scripts/gcp/deploy-lesson-autopilots.mjs';

test('a ready-by-time queue with no canonical prerequisites is reported as waiting, not empty', async () => {
  const now=new Date('2026-11-07T13:00:00Z');
  const image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:'+'a'.repeat(64);
  const source={spec:{template:{spec:{template:{spec:{containers:[{image}]}}}}}};
  const jobs=[{id:'stage-1',status:'queued',available_at:'2026-11-07T11:00:00Z',
    attempts:0,max_attempts:5,payload:{autopilot:{role:'quality'}},build:{status:'running',owner_paused:false}}];
  const calls=[];
  const result=await dispatchLessonAutopilots({
    now,env:{SUPABASE_SERVICE_ROLE_KEY:'test-only'},
    clock:()=>now.getTime(),assignmentAttempts:1,
    run:args=>{
      calls.push(args);
      assert.notEqual(args[2],'execute','must not start a paid worker with unmet prerequisites');
      if(args[2]==='executions')return '[]';
      if(args[2]==='describe'){
        if(args[3]==='elevate-course-builder-parallel')return JSON.stringify(source);
        const role=Object.keys(LESSON_ROLE_JOBS).find(r=>LESSON_ROLE_JOBS[r].name===args[3]);
        assert.ok(role);
        return JSON.stringify({spec:{template:{spec:{taskCount:1,parallelism:1,
          template:{spec:{containers:[{image,env:[{name:'ULTIMATE_AUTOPILOT_ROLE',value:role}]}]}}}}}});
      }
      throw Error('Unexpected cloud operation');
    },
    request:async url=>{
      if(url.pathname.endsWith('/ultimate_build_jobs'))return {ok:true,json:async()=>jobs};
      if(url.pathname.endsWith('/rpc/ultimate_autopilot_ready_jobs'))return {ok:true,json:async()=>[]};
      throw Error('Unexpected database operation');
    },
  });
  assert.equal(result.status,'retry_wait');
  assert.equal(result.reason,'canonical_prerequisites_not_satisfied');
  assert.equal(result.queuedStagesWaitingForPrerequisites,1);
  assert.equal(result.canonicalReadyStages,0);
  assert.equal(result.activeExecutions,0);
  assert.ok(calls.every(args=>args[2]!=='execute'));
});
