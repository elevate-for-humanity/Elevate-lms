import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyParisRuntimeOrigins} from '../../lib/ai/runtime/paris-runtime-evidence.mjs';

const SHA = 'a'.repeat(40);
const sites = ['https://admin.elevateforhumanity.org','https://app.elevateforhumanity.org'];

test('verifies every serving origin afresh rather than trusting prior receipts',async()=>{
 const called=[];
 const evidence=await verifyParisRuntimeOrigins({origins:sites,releaseSha:SHA,
  checkedAt:'2026-11-05T12:00:00Z',
  fetchImpl:async (url,options)=>{called.push(url);assert.equal(options.cache,'no-store');
   return {ok:true,json:async()=>({commitSha:SHA})};}});
 assert.equal(evidence.passed,true);
 assert.deepEqual(called,sites.map(x=>x+'/api/health'));
 assert.equal(evidence.checkedAt,'2026-11-05T12:00:00Z');
});

test('one stale runtime blocks PARIS verification',async()=>{
 const evidence=await verifyParisRuntimeOrigins({origins:sites,releaseSha:SHA,
  fetchImpl:async url=>({ok:true,json:async()=>({commitSha:url.includes('admin')?SHA:'b'.repeat(40)})})});
 assert.equal(evidence.passed,false);
 assert.equal(evidence.origins[1].reason,'revision_mismatch');
});

test('network, malformed health JSON, and readiness failures fail closed',async()=>{
 const network=await verifyParisRuntimeOrigins({origins:sites,releaseSha:SHA,
  fetchImpl:async url=>{if(url.includes('admin'))throw Error('offline');
   return {ok:true,json:async()=>{throw Error('malformed');}};}});
 assert.equal(network.passed,false);
 assert.deepEqual(network.origins.map(x=>x.reason),['probe_unavailable','probe_unavailable']);
 const readiness=await verifyParisRuntimeOrigins({origins:[sites[0]],releaseSha:SHA,
  protectedMerge:true,fetchImpl:async()=>({ok:true,json:async()=>({commitSha:SHA,healthy:true,ready:false})})});
 assert.equal(readiness.passed,false);
 assert.equal(readiness.origins[0].reason,'not_ready');
});

test('invalid revisions and unsafe origins are never verified',async()=>{
 const bad=await verifyParisRuntimeOrigins({origins:sites,releaseSha:'unknown',
  fetchImpl:async()=>{throw Error('should not reach network');}});
 assert.equal(bad.passed,false);
 const unsafe=await verifyParisRuntimeOrigins({origins:['http://localhost:3000'],releaseSha:SHA,
  fetchImpl:async()=>{throw Error('should not reach network');}});
 assert.equal(unsafe.passed,false);
 assert.equal(unsafe.origins[0].reason,'invalid_origin');
});
