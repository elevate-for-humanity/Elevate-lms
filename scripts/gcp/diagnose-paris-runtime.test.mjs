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
test('diagnostics use bounded read-only operations and propagate access failures',()=>{
 const calls=[];const report=diagnoseParisRuntime({run:args=>{calls.push(args);return args[0]==='logging'?'[]':JSON.stringify({spec:{template:{spec:{containerConcurrency:1,timeoutSeconds:300,containers:[{env:[{name:'SECRET',value:'private-secret'}],resources:{limits:{cpu:'4',memory:'8Gi'}}}]}}}});}});
 assert.equal(report.readOnly,true);assert.equal(calls.length,2);assert.deepEqual(calls[0].slice(0,2),['logging','read']);
 assert.deepEqual(calls[1].slice(0,3),['run','services','describe']);
 assert.equal(report.runtime.concurrency,1);assert.equal(report.runtime.resources.memory,'8Gi');
 assert.ok(!JSON.stringify(report).includes('private-secret'));
 assert.ok(calls[0].includes('--limit=50'));assert.ok(calls[0].includes('--freshness=4h'));
 assert.throws(()=>diagnoseParisRuntime({run:()=>{throw Error('permission_denied');}}),/permission_denied/);
});

test('system logs identify memory exhaustion without copying arbitrary log content',()=>{
 const [result]=summarizeParisLogs([{textPayload:'Memory limit of 8192 MiB exceeded. private diagnostic content'}]);
 assert.equal(result.runtimeFailure,'memory_limit_exceeded');assert.ok(!JSON.stringify(result).includes('private'));
});

test('Studio session diagnostics retain allowlisted upstream failures without exposing credentials',()=>{
 const events=summarizeParisLogs(['session_restore_failed','browser_unavailable','secret-token'].map(upstreamError=>({
  jsonPayload:{message:'[studio-browser] Session creation rejected',context:{status:503,upstreamError,ownerId:'private-owner',token:'private-token'}},
 })));
 assert.equal(events[0].browserFailure,'session_restore_failed');
 assert.equal(events[1].browserFailure,'browser_unavailable');
 assert.equal(events[2].browserFailure,'unclassified_browser_failure');
 assert.equal(events[0].upstreamStatus,503);
 assert.ok(!JSON.stringify(events).includes('private'));
 assert.ok(!JSON.stringify(events).includes('secret-token'));
 const calls=[];diagnoseParisRuntime({run:args=>{calls.push(args);return args[0]==='logging'?'[]':'{}';}});
 assert.match(calls[0][2],/\[studio-browser\] Session creation rejected/);
});
