import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectGoogleBindings, auditGoogleStudio, deployedRuntimeEnvironment } from './audit-studio-backend-end-to-end.mjs';
const config={runtimeEnvironment:{
  ELEVATE_RUNTIME_CONFIG_PROVIDER:'google-secret-manager',
  STUDIO_BROWSER_URL:'https://browser.elevateforhumanity.org',
  STUDIO_BROWSER_PUBLIC_URL:'https://browser.elevateforhumanity.org',
  CLOUDFLARE_ACCOUNT_ID:'acct',
  CLOUDFLARE_AI_API_TOKEN:'example-secret',
  CLOUDFLARE_AI_MODEL:'@cf/model',
}};
const resource=()=>({spec:{template:{spec:{containers:[{image:'us-central1-docker.pkg.dev/project/elevate/admin:sha',
 env:['STUDIO_BROWSER_URL','STUDIO_BROWSER_PUBLIC_URL','STUDIO_BROWSER_SECRET',
 'CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_AI_API_TOKEN','CLOUDFLARE_AI_MODEL'].map(name=>({name,value:config.runtimeEnvironment[name]||'present'}))}]}}},status:{latestReadyRevisionName:'admin-123'}});
const browser={spec:{template:{spec:{containers:[{image:'us-central1-docker.pkg.dev/project/elevate/browser:sha',env:[]}]}}},status:{latestReadyRevisionName:'browser-123'}};
test('reports configured Google resources when image and secret bindings exist',()=>{
 assert.deepEqual(inspectGoogleBindings(config,resource(),browser).failures,[]);
});
test('detects an existing browser service without an image and removed Cloudflare runtime bindings',()=>{
 const admin=resource();
 admin.spec.template.spec.containers[0].env=admin.spec.template.spec.containers[0].env.filter(x=>!x.name.startsWith('CLOUDFLARE_'));
 const findings=inspectGoogleBindings(config,admin,{spec:{template:{spec:{containers:[]}}}}).failures;
 assert.ok(findings.includes('studio_browser_container_image_unverified'));
 assert.ok(findings.includes('admin_unbound_CLOUDFLARE_AI_API_TOKEN'));
});
test('rejects a legacy Northflank browser endpoint',()=>{
 const admin=resource();
 admin.spec.template.spec.containers[0].env.find(x=>x.name==='STUDIO_BROWSER_URL').value='https://old.northflank.app';
 assert.ok(inspectGoogleBindings(config,admin,browser).failures.includes('browser_legacy_or_insecure_STUDIO_BROWSER_URL'));
});

function vmAuditRun(instances){return args=>{
 if(args[0]==='secrets')return JSON.stringify({version:1,component:'admin',runtimeEnvironment:config.runtimeEnvironment,volumes:[],runtimeFiles:{}});
 if(args[0]==='compute')return JSON.stringify(instances);
 if(args.includes('elevate-admin-migration'))return JSON.stringify(resource());
 throw Error('service absent');
};}
test('a missing Cloud Run browser requires an actually running owned Google VM',async()=>{
 const report=await auditGoogleStudio({run:vmAuditRun([]),request:async()=>({status:200,ok:true})});
 assert.equal(report.passed,false);assert.ok(report.failures.includes('studio_browser_google_vm_not_running'));
});
test('a running Google VM and healthy endpoint satisfy the supported VM topology',async()=>{
 const report=await auditGoogleStudio({run:vmAuditRun([{name:'elevate-studio-browser-trial',status:'RUNNING'}]),request:async()=>({status:200,ok:true})});
 assert.equal(report.passed,true);assert.equal(report.probes.browserVmRunning,true);
});

test('actual direct deployment values override a stale bootstrap configuration without exposing values',()=>{
 const admin=resource();const env=deployedRuntimeEnvironment({runtimeEnvironment:{}},admin);
 assert.equal(env.STUDIO_BROWSER_URL,config.runtimeEnvironment.STUDIO_BROWSER_URL);
 assert.equal(env.CLOUDFLARE_AI_MODEL,'@cf/model');
 assert.deepEqual(inspectGoogleBindings({runtimeEnvironment:{}},admin,browser).failures,[]);
});

test('provider authorization rejection prevents a passing live audit',async()=>{
 const report=await auditGoogleStudio({run:vmAuditRun([{name:'elevate-studio-browser-trial',status:'RUNNING'}]),request:async url=>String(url).includes('api.cloudflare.com')?{status:401,ok:false}:{status:200,ok:true}});
 assert.equal(report.passed,false);assert.ok(report.failures.includes('cloudflare_model_catalog_http_401'));
});

test('an unresolved deployment secret never falls back to a different bootstrap credential',()=>{
 const admin=resource();admin.spec.template.spec.containers[0].env.find(x=>x.name==='CLOUDFLARE_AI_API_TOKEN').value=undefined;
 admin.spec.template.spec.containers[0].env.find(x=>x.name==='CLOUDFLARE_AI_API_TOKEN').valueFrom={secretKeyRef:{name:'scoped-token',key:'latest'}};
 assert.equal(deployedRuntimeEnvironment(config,admin).CLOUDFLARE_AI_API_TOKEN,undefined);
 assert.ok(inspectGoogleBindings(config,admin,browser).failures.includes('google_config_missing_CLOUDFLARE_AI_API_TOKEN'));
});
