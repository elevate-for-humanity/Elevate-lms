import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectGoogleBindings } from './audit-studio-backend-end-to-end.mjs';
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
 'CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_AI_API_TOKEN','CLOUDFLARE_AI_MODEL'].map(name=>({name,value:'present'}))}]}}},status:{latestReadyRevisionName:'admin-123'}});
const browser={spec:{template:{spec:{containers:[{image:'us-central1-docker.pkg.dev/project/elevate/browser:sha',env:[]}]}}},status:{latestReadyRevisionName:'browser-123'}};
test('reports configured Google resources when image and secret bindings exist',()=>{
 assert.deepEqual(inspectGoogleBindings(config,resource(),browser).failures,[]);
});
test('detects deleted browser service and removed Cloudflare runtime bindings',()=>{
 const admin=resource();
 admin.spec.template.spec.containers[0].env=admin.spec.template.spec.containers[0].env.filter(x=>!x.name.startsWith('CLOUDFLARE_'));
 const findings=inspectGoogleBindings(config,admin,null).failures;
 assert.ok(findings.includes('studio_browser_container_image_unverified'));
 assert.ok(findings.includes('admin_unbound_CLOUDFLARE_AI_API_TOKEN'));
});
test('rejects a legacy Northflank browser endpoint',()=>{
 const admin=resource();
 admin.spec.template.spec.containers[0].env.find(x=>x.name==='STUDIO_BROWSER_URL').value='https://old.northflank.app';
 assert.ok(inspectGoogleBindings(config,admin,browser).failures.includes('browser_legacy_or_insecure_STUDIO_BROWSER_URL'));
});
