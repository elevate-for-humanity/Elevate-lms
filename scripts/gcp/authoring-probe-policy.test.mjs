import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {authoringProbeDecision} from './authoring-probe-policy.mjs';
const now=Date.parse('2026-10-30T10:00:00Z');
const probe=minutes=>({spec:{template:{spec:{containers:[{args:['DIRECT_AUTHORING_DIAGNOSTIC_V1']}]}}},status:{completionTime:new Date(now-minutes*60000).toISOString()}});
test('old billing denial does not permanently block a post-payment test',()=>assert.equal(authoringProbeDecision([probe(60)],now),'probe'));
test('a recent probe prevents duplicate paid requests',()=>assert.equal(authoringProbeDecision([probe(2)],now),'recent-probe-preserved'));
test('active course execution is preserved even when the previous probe is old',()=>assert.equal(authoringProbeDecision([probe(60),{status:{conditions:[{type:'Completed',status:'Unknown'}]}}],now),'active-execution-preserved'));
test('a terminal execution without a completion timestamp does not block forever',()=>assert.equal(authoringProbeDecision([{status:{conditions:[{type:'Completed',status:'False'}]}}],now),'probe'));
test('malformed state fails before starting a paid request',()=>assert.throws(()=>authoringProbeDecision(null,now),/STATE_REQUIRED/));

test('stop diagnostics read both approved regions and quota denials without starting any execution',async()=>{
 const calls=[];
 const code=readFileSync(new URL('./course-worker-stop-diagnostics.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 await new AsyncFunction('execFileSync','console',code)((command,args)=>{
  calls.push({command,args});
  assert.equal(command,'gcloud');
  assert.equal(args.includes('execute'),false,'diagnostics must never reserve worker capacity or invoke inference');
  if(args[0]==='logging'||args.includes('list'))return '[]';
  return JSON.stringify(args[0]==='billing'?{billingEnabled:true}:{});
 },{log:()=>{}});
 assert.ok(calls.some(c=>c.args.includes('--region=us-east1')&&c.args.includes('--job=elevate-direct-course-release')));
 assert.ok(calls.some(c=>c.args.includes('--region=us-central1')&&c.args.includes('--job=elevate-direct-course-release')));
 assert.ok(calls.some(c=>c.args.some(a=>a.includes('protoPayload.status.code=8'))));
});

