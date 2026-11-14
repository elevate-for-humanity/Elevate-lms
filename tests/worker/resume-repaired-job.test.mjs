import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resumeRepairedJob} from '../../lib/ultimate-course-builder/worker/resume-repaired-job.mjs';
const source={id:'same-job',status:'failed',execution_generation:8,attempts:4,payload:{autopilot:{role:'quality'},competencyId:'lesson'},monitor:{enabled:true},last_error:'caption failure'};
const repair={id:'repair',release_sha:'fixed-sha',verification:{exactRuntimeSha:true}};
test('resume requires a verified deployed correction',async()=>{
 await assert.rejects(resumeRepairedJob({db:{},source,repair:{...repair,verification:{}}}),/DEPLOYED_REPAIR_REQUIRED/);
 assert.equal(await resumeRepairedJob({db:{},source:{...source,status:'running'},repair}),null);
});
test('resume preserves original job, role and cursor with a new fenced generation',async()=>{
 const calls=[];let write;
 const query={};
 for(const method of ['eq','is','select'])query[method]=(...args)=>{calls.push([method,...args]);return query;};
 query.maybeSingle=async()=>({data:{...source,...write}});
 const db={from:()=>({update(value){write=value;return query;}})};
 const result=await resumeRepairedJob({db,source,repair});
 assert.equal(result.id,source.id);
 assert.equal(result.execution_generation,9);
 assert.deepEqual(result.payload.autopilot,source.payload.autopilot);
 assert.equal(result.payload.competencyId,'lesson');
 assert.equal(result.monitor.previousFailure.attempts,4);
 assert.equal(result.payload.codeRepairSourceGeneration,8);
 assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='execution_generation'&&c[2]===8));
 assert.equal(await resumeRepairedJob({db:{},source:result,repair}),result);
});
