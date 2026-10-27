import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtimeHeapMiB} from './runtime-memory-policy.mjs';
const GiB=2**30;
test('existing eight-GiB containers retain their approved four-GiB heap ceiling',()=>{
 assert.equal(runtimeHeapMiB(8*GiB),4096);assert.equal(runtimeHeapMiB(16*GiB),4096);
});
test('smaller test candidates reserve memory for native allocations instead of exceeding their container limit',()=>{
 assert.equal(runtimeHeapMiB(4*GiB),2048);assert.equal(runtimeHeapMiB(2*GiB),1024);
 for(const size of [1,2,4,8,16])assert.ok(runtimeHeapMiB(size*GiB)*2**20<=size*GiB/2);
});
test('unknown or unsupported memory budgets cannot silently start an oversized runtime',()=>{
 for(const size of [NaN,Infinity,0,-1,512*2**20])assert.throws(()=>runtimeHeapMiB(size),/UNSUPPORTED/);
});
test('the final web image calculates the heap inside its own runtime cgroup and execs Node',()=>{
 const docker=readFileSync(new URL('../Dockerfile.marketing',import.meta.url),'utf8');
 assert.match(docker,/COPY.*scripts\/runtime-memory-policy.mjs/);
 assert.match(docker,/exec node --max-old-space-size=\$\(node scripts\/runtime-memory-policy.mjs\)/);
});
