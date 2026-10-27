import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const workflow=readFileSync(new URL('../../.github/workflows/deploy-google-repaired.yml',import.meta.url),'utf8');
const start=workflow.indexOf("          const component = process.env.COMPONENT;");
const end=workflow.indexOf('          // /health confirms',start);
assert.ok(start>=0 && end>start);
const body=workflow.slice(start,end);
const run=new Function('fetch','Date','AbortSignal','process','console','setTimeout',`return (async()=>{${body}})()`);
async function probe(sequence){
 let now=0,calls=0;
 const logs=[];
 const fetch=async(url)=>{
  assert.equal(url,'https://canonical-lms.us-central1.run.app/api/health');
  const item=sequence[Math.min(calls++,sequence.length-1)];
  if(item==='timeout'){now+=20000;const e=new Error('private');e.name='TimeoutError';throw e;}
  if(item==='invalid')return {status:200,json:async()=>{throw new SyntaxError('private');}};
  return {status:200,json:async()=>({service:'lms',commit:item==='wrong-sha'?'wrong':'expected',healthy:true,ready:true,dependencies:{supabase:{ok:true}}})};
 };
 const promise=run(fetch,{now:()=>now},{timeout:()=>({})},{env:{COMPONENT:'lms',IMAGE_SHA:'expected',HEALTH_BASE_URL:'https://canonical-lms.us-central1.run.app'}},{log:x=>logs.push(x)},(fn,ms)=>{now+=ms;fn();});
 return {promise,get calls(){return calls;},logs};
}
test('single transient timeout recovers only after three consecutive healthy responses',async()=>{
 const p=await probe(['good','timeout','good']);await p.promise;assert.equal(p.calls,5);
 assert.ok(p.logs.some(x=>x.includes('transient_health_transport')));
 assert.ok(!p.logs.some(x=>x.includes('private')));
});
test('persistent timeouts exhaust the bounded health deadline',async()=>{
 const p=await probe(['timeout']);await assert.rejects(p.promise,/bounded response|two minutes/);assert.ok(p.calls<=6);
});
for(const failure of ['wrong-sha','invalid'])test(`${failure} cannot pass the release gate`,async()=>{
 const p=await probe([failure]);await assert.rejects(p.promise);assert.equal(p.calls,1);
});

test('health token audience and probes use the same resolved canonical URL',()=>{
 assert.match(workflow,/id_token_audience: \$\{\{ steps\.health_target\.outputs\.url \}\}/);
 assert.match(workflow,/HEALTH_BASE_URL: \$\{\{ steps\.health_target\.outputs\.url \}\}/);
 assert.ok(!workflow.includes('migration-aabnh2y32a-uc.a.run.app'));
});
