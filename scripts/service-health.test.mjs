import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const moduleUrl = source => 'data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64');
// Load the real dependency too: relative imports cannot resolve from data URLs.
const runtimeServiceUrl = moduleUrl(readFileSync('lib/health/public-runtime-service.ts','utf8'));
const source = stripTypeScriptTypes(readFileSync('lib/health/service-health.ts','utf8'))
 .replace("'./public-runtime-service'",JSON.stringify(runtimeServiceUrl));
const {checkSupabaseHealth,getRuntimeReadiness} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const keys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','GIT_SHA','GITHUB_SHA','NEXT_PUBLIC_GIT_SHA','K_SERVICE','APPLICATION_SERVICE','STORE_ONLY_RUNTIME'];
async function configured(work) {
 const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='private-test-value';
 process.env.K_SERVICE='elevate-marketing-migration';
 try {await work();} finally {for(const k of keys)if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}
}
test('Auth success cannot conceal failed database reads',()=>configured(async()=>{
 const seen=[];const result=await checkSupabaseHealth(100,async(url,options)=>{seen.push([url,options.method]);return {ok:!url.includes('/rest/'),status:url.includes('/rest/')?503:200,json:async()=>({error:'private-body'})};});
 assert.equal(result.ok,false);assert.equal(result.checks.auth.ok,true);assert.equal(result.checks.database.ok,false);
 assert.ok(seen.some(([u,m])=>u.endsWith('/rest/v1/programs?select=id&limit=1')&&m==='GET'));
 assert.equal(JSON.stringify(result).includes('private-'),false);
}));
test('valid database row array and Auth pass without exposing records',()=>configured(async()=>{
 const result=await checkSupabaseHealth(100,async()=>({ok:true,status:200,json:async()=>[{id:'must-not-leak'}]}));
 assert.equal(result.ok,true);assert.equal(JSON.stringify(result).includes('must-not-leak'),false);
}));
test('HTTP success with invalid database body fails',()=>configured(async()=>{
 const result=await checkSupabaseHealth(100,async()=>({ok:true,status:200,json:async()=>({})}));assert.equal(result.ok,false);assert.equal(result.checks.database.error,'invalid_response');
}));
test('timeouts remain distinguishable and never leak messages',()=>configured(async()=>{
 const result=await checkSupabaseHealth(100,async()=>{throw new DOMException('private-message','TimeoutError');});assert.equal(result.error,'TimeoutError');assert.equal(JSON.stringify(result).includes('private-message'),false);
}));
test('readiness falls through empty commit and rejects malformed identities',()=>configured(async()=>{
 process.env.GIT_SHA='';process.env.GITHUB_SHA='a'.repeat(40);assert.equal(getRuntimeReadiness().ready,true);
 process.env.GIT_SHA='bad';assert.ok(getRuntimeReadiness().missing.includes('BUILD_COMMIT'));
}));
test('Store probes its own products catalog rather than the LMS programs table',()=>configured(async()=>{
 process.env.K_SERVICE='elevate-store-migration';
 const seen=[];
 const result=await checkSupabaseHealth(100,async url=>{seen.push(url);return {ok:true,status:200,json:async()=>[]};});
 assert.equal(result.ok,true);
 assert.ok(seen.some(url=>url.endsWith('/rest/v1/products?select=id&limit=1')));
 assert.equal(seen.some(url=>url.includes('/rest/v1/programs')),false);
}));
