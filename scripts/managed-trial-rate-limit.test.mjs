import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
const require = createRequire(import.meta.url);
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = fileURLToPath(new URL('../apps/marketing/app/api/trial/start-managed/route.ts', import.meta.url));
function load(limiter) {
 let provisionCalls = 0;
 const module = { exports: {} };
 const mocks = {
  'next/server': { NextResponse: { json: (body, init={}) => ({status:init.status || 200,body}) } },
  '@/lib/rate-limit': { strictRateLimit: { get: () => limiter } },
  '@/lib/audit/withApiAudit': { withApiAudit: (_name,handler) => handler },
  '@/lib/api/withRuntime': { withRuntime: (_options,handler) => handler },
  '@/lib/config/platform-config': { PLATFORM_DEFAULTS: {} },
  '@/lib/logger': { logger: {warn(){},error(){}} },
  '@/lib/workspace/start-workspace-trial': { startWorkspaceTrial: async () => {provisionCalls++;return {error:'PROVISION_REACHED',status:409};} },
 };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>mocks[n]||{},URL,Date,Math,Map});
 return {post:()=>module.exports.POST({json:async()=>({orgName:'Test organization',adminName:'Test owner',adminEmail:'owner@example.test'})}),calls:()=>provisionCalls};
}
test('managed trial survives Redis failure without losing throttling', async()=>{
 const outage=load({limit:async()=>{throw new TypeError('c.map is not a function');}});
 for(let i=0;i<3;i++)assert.equal((await outage.post()).status,409,'Redis outage must reach provisioning within local limit');
 assert.equal((await outage.post()).status,429,'Fourth outage request must remain throttled');
 assert.equal(outage.calls(),3);
 const denial=load({limit:async()=>({success:false})});
 assert.equal((await denial.post()).status,429);assert.equal(denial.calls(),0);
 const healthy=load({limit:async()=>({success:true})});
 assert.equal((await healthy.post()).status,409);assert.equal(healthy.calls(),1);
 const missing=load(null);
 for(let i=0;i<3;i++)assert.equal((await missing.post()).status,409);
 assert.equal((await missing.post()).status,429);
 console.log('PASS: Redis outage, explicit denial, healthy Redis, missing Redis, and fallback exhaustion');
});
