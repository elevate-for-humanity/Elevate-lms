import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const directory=new URL('../../.github/workflows/',import.meta.url);
function sharedPolicies(source) {
 const lines=source.split('\n'),policies=[];
 for(let i=0;i<lines.length;i++) {
  const line=lines[i];
  if(!/group:\s*google-runtime-us-central1(?:[,}\s]|$)/.test(line))continue;
  if(line.includes('{')) {policies.push(line);continue;}
  const indent=line.length-line.trimStart().length;
  let end=i+1;
  while(end<lines.length && (!lines[end].trim() || lines[end].length-lines[end].trimStart().length>=indent))end++;
  policies.push(lines.slice(i,end).join('\n'));
 }
 return policies;
}
const retained=policy=>/queue:\s*max\b/.test(policy)&&/cancel-in-progress:\s*false\b/.test(policy);
test('all Google web-runtime publishers serialize without replacing pending releases',()=>{
 const policies=readdirSync(directory).filter(file=>/\.ya?ml$/.test(file)).flatMap(file=>sharedPolicies(readFileSync(new URL(file,directory),'utf8')).map(policy=>({file,policy})));
 assert.ok(policies.length>0,'Shared Google release policies were not found');
 assert.deepEqual(policies.filter(({policy})=>!retained(policy)).map(({file})=>file),[],
  'A single-slot publisher can displace an Admin release waiting in the same concurrency group');
});
test('a single-slot request fails the same invariant even when it preserves the active release',()=>{
 assert.equal(retained('group: google-runtime-us-central1\ncancel-in-progress: false'),false);
 assert.equal(retained('group: google-runtime-us-central1\ncancel-in-progress: false\nqueue: max'),true);
});
