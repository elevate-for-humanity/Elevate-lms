import test from 'node:test';
import assert from 'node:assert/strict';
import {validateManifest,classify,getJobs,compactJobs} from './consolidated-recovery-audit.mjs';
const row={id:1,sha:'a'.repeat(40),path:'.github/workflows/deploy-admin.yml',result:'failure'};
test('baseline counts and duplicate IDs must be verified',()=>{
 assert.deepEqual(validateManifest({schema:'efh-recovery-manifest-v1',runs:[row],snapshot_counts:{failure:1}}),{failure:1});
 assert.throws(()=>validateManifest({schema:'efh-recovery-manifest-v1',runs:[row,row],snapshot_counts:{failure:2}}),/DUPLICATE/);
 assert.throws(()=>validateManifest({schema:'efh-recovery-manifest-v1',runs:[row],snapshot_counts:{failure:2}}),/COUNTS/);
});
test('all job pages are read, and truncated pages do not count as complete',async()=>{
 let calls=[];const d=await getJobs(async p=>{calls.push(p);return {total_count:2,jobs:[{id:calls.length}]};},99);
 assert.equal(calls.length,2);assert.equal(d.jobs.length,2);assert.equal(d.complete,true);
 await assert.rejects(()=>getJobs(async()=>({total_count:2,jobs:[]}),99),/INCOMPLETE/);
});
test('green jobs and ancestry alone never establish production presence',()=>{
 const r={service:'admin',inMain:true,inLive:true,jobsComplete:true};
 assert.equal(classify(r),'CURRENT_PRODUCTION_NOT_VERIFIED');
 assert.equal(classify({...r,live:{verified:true}}),'SOURCE_ANCESTRY_PRESENT_IN_VERIFIED_LIVE');
 assert.equal(classify({...r,inMain:false,live:{verified:true}}),'SOURCE_NOT_IN_CURRENT_MAIN');
 assert.equal(classify({...r,jobsComplete:false,live:{verified:true}}),'JOB_EVIDENCE_INCOMPLETE');
});
test('failed steps and skipped steps remain distinct evidence',()=>{
 const r=compactJobs({complete:true,total:1,jobs:[{id:1,name:'deploy',steps:[{name:'test',number:1,conclusion:'failure'},{name:'promote',number:2,conclusion:'skipped'}]}]});
 assert.equal(r.items[0].failedSteps[0].name,'test');assert.equal(r.items[0].skippedSteps[0].name,'promote');
});
