import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseParisRuntime,summarizeParisLogs} from './diagnose-paris-runtime.mjs';

test('runtime diagnostics preserve the exact known failure without exposing unrelated fields',()=>{
 const [result]=summarizeParisLogs([{timestamp:'2026-10-29T19:37:56Z',resource:{labels:{service_name:'elevate-admin-migration',revision_name:'revision'}},jsonPayload:{message:'[devstudio/chat] owned stream failed',error:{message:'Elevate LLM worker streaming request failed: HTTP 400',stack:'private-stack'},context:{token:'private-token',prompt:'private-prompt'}},httpRequest:{status:400,latency:'11.687s',requestUrl:'https://private.example/?token=secret'}}]);
 assert.equal(result.failure,'Elevate LLM worker streaming request failed: HTTP 400');
 assert.equal(result.httpStatus,400);assert.equal(result.latency,'11.687s');
 assert.ok(!JSON.stringify(result).includes('private'));
});
test('unrecognized provider payloads are never copied into diagnostics',()=>{
 const [result]=summarizeParisLogs([{textPayload:JSON.stringify({message:'[devstudio/chat] owned stream failed',error:{message:'secret credentials'}})}]);
 assert.equal(result.failure,'unclassified_provider_failure');assert.ok(!JSON.stringify(result).includes('secret'));
});
test('diagnostics use one bounded read-only query and propagate access failures',()=>{
 const calls=[];const report=diagnoseParisRuntime({run:args=>{calls.push(args);return '[]';}});
 assert.equal(report.readOnly,true);assert.equal(calls.length,1);assert.deepEqual(calls[0].slice(0,2),['logging','read']);
 assert.ok(calls[0].includes('--limit=50'));assert.ok(calls[0].includes('--freshness=4h'));
 assert.throws(()=>diagnoseParisRuntime({run:()=>{throw Error('permission_denied');}}),/permission_denied/);
});
