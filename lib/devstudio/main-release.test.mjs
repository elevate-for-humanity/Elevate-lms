import test from 'node:test';
import assert from 'node:assert/strict';
import {publishTaskToMain} from './main-release.mjs';
const baseSha='a'.repeat(40),branchSha='b'.repeat(40);
test('publishes a complete task as a non-force main update without a PR',async()=>{
 const calls=[];
 const result=await publishTaskToMain({baseSha,branchSha,githubJson:async(path,init)=>{calls.push({path,init});return {object:{sha:init?branchSha:baseSha}};}});
 assert.equal(result.verifiedLive,false);assert.equal(result.status,'pending-validation');
 assert.deepEqual(JSON.parse(calls[1].init.body),{sha:branchSha,force:false});
 assert.equal(calls.length,2);assert.equal(calls.some(x=>x.path.includes('pulls')),false);
});
test('retains task work and refuses to overwrite a newer main',async()=>{
 let writes=0;await assert.rejects(publishTaskToMain({baseSha,branchSha,githubJson:async(_,init)=>{if(init)writes++;return {object:{sha:'c'.repeat(40)}};}}),/Main changed/);assert.equal(writes,0);
});
test('does not report success when branch publication is rejected or unconfirmed',async()=>{
 await assert.rejects(publishTaskToMain({baseSha,branchSha,githubJson:async(_,init)=>({object:{sha:baseSha}})}),/not confirmed/);
});
