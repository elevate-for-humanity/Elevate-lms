import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyParisRuntimeOrigins} from '../../lib/ai/runtime/paris-runtime-evidence.mjs';
const sha='a'.repeat(40), origins=['https://admin.elevateforhumanity.org'];
test('DNS errors are distinct from HTTP failures',async()=>{
 const err=new TypeError('fetch failed',{cause:Object.assign(new Error('lookup'),{code:'ENOTFOUND'})});
 const result=await verifyParisRuntimeOrigins({origins,releaseSha:sha,fetchImpl:async()=>{throw err;}});
 assert.equal(result.passed,false);
 assert.equal(result.origins[0].reason,'dns_unavailable');
});
test('HTTP 503 remains a failed health receipt',async()=>{
 const result=await verifyParisRuntimeOrigins({origins,releaseSha:sha,fetchImpl:async()=>({ok:false,status:503})});
 assert.equal(result.origins[0].reason,'http_503');
});
