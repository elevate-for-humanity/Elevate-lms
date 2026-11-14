import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverExactCourseExecution} from './recover-exact-course-execution.mjs';
const image=d=>'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:'+d.repeat(64);
function fixture({different=false,terminal=false,race=false}={}) {
 const calls=[];let reads=0,cancelled=false;
 const run=args=>{
  calls.push(args);
  if(args[2]==='describe')return JSON.stringify({spec:{template:{spec:{template:{spec:{containers:[{image:image('a')}]}}}}}});
  if(args[3]==='cancel'){cancelled=true;return '';}
  assert.equal(args[3],'describe');reads++;
  return JSON.stringify({spec:{template:{spec:{containers:[{image:image(different||race&&reads>1?'b':'a')}]}}},status:terminal||cancelled?{completionTime:'2026-10-17T00:00:00Z'}:{}});
 };
 return {run,calls};
}
test('a terminal historical image reports its difference without a mutation',async()=>{
 const f=fixture({different:true,terminal:true});
 const result=await recoverExactCourseExecution({name:'elevate-course-builder-x7tbr',...f});
 assert.equal(result.state,'already_terminal');assert.equal(result.imageMatches,false);
 assert.equal(result.cancellationRequested,false);assert.equal(f.calls.length,2);
});
for(const options of [{different:true},{race:true}])test('active mismatched images keep the integrity gate',async()=>{
 const f=fixture(options);
 await assert.rejects(recoverExactCourseExecution({name:'elevate-course-builder-x7tbr',...f}),/EXECUTION_IMAGE_MISMATCH/);
 assert.equal(f.calls.some(x=>x.includes('cancel')),false);
});
test('only the exact verified execution is cancelled and termination is confirmed',async()=>{
 const f=fixture();const result=await recoverExactCourseExecution({name:'elevate-course-builder-x7tbr',...f});
 assert.equal(result.state,'terminal');assert.equal(result.checkpointsRetained,true);
 const writes=f.calls.filter(x=>x.includes('cancel'));
 assert.equal(writes.length,1);assert.equal(writes[0][4],'elevate-course-builder-x7tbr');
});
test('missing exact target fails before reading Google',async()=>{
 await assert.rejects(recoverExactCourseExecution({run:()=>{throw Error('must not run');}}),/EXACT_EXECUTION_REQUIRED/);
});
