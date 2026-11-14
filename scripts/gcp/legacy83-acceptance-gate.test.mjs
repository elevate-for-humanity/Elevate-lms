import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyLegacy83Candidate} from './legacy83-acceptance-gate.mjs';
test('successful preview acceptance never rolls back',async()=>{
 let rollbacks=0;
 assert.equal(await verifyLegacy83Candidate(async()=> 'accepted',async()=>{rollbacks++;}),'accepted');
 assert.equal(rollbacks,0);
});
test('failed acceptance restores the previous preview before rejecting',async()=>{
 const order=[],failure=new Error('asset acceptance failed');
 await assert.rejects(verifyLegacy83Candidate(async()=>{order.push('verify');throw failure;},async()=>{order.push('rollback');}),error=>error===failure);
 assert.deepEqual(order,['verify','rollback']);
});
test('rollback failures preserve both errors and never claim acceptance',async()=>{
 const original=new Error('candidate'),restore=new Error('rollback');
 await assert.rejects(verifyLegacy83Candidate(async()=>{throw original;},async()=>{throw restore;}),error=>{
  assert.ok(error instanceof AggregateError);assert.deepEqual(error.errors,[original,restore]);return true;
 });
});
test('the complete beta gate runs before prior containers are retired',()=>{
 const source=readFileSync(new URL('./deploy-legacy83-website.mjs',import.meta.url),'utf8');
 const gate=source.indexOf('await verifyLegacy83Candidate('),beta=source.indexOf('execFileSync(process.execPath'),cleanup=source.indexOf('// Remove the old container');
 assert.ok(gate>=0&&beta>gate&&cleanup>beta);
 assert.match(source,/Caddyfile.previous/);assert.match(source,/\/academy\/my-learning/);
});
