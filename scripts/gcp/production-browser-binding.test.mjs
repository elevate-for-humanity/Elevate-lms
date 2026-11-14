import test from 'node:test';
import assert from 'node:assert/strict';
import {productionBrowserEnvironment} from './production-browser-binding.mjs';
const origin='https://elevate-studio-browser-aabnh2y32a-uc.a.run.app';
const resource=url=>({metadata:{name:'elevate-studio-browser'},status:{url,traffic:[{tag:'studio-verify',url:'https://studio-verify---elevate-studio-browser-aabnh2y32a-uc.a.run.app'}]}});
test('production uses the stable service origin even when a preview alias exists',()=>assert.deepEqual(productionBrowserEnvironment(resource(origin)),{STUDIO_BROWSER_URL:origin,STUDIO_BROWSER_PUBLIC_URL:origin}));
test('number-based canonical Cloud Run origins remain supported',()=>{const url='https://elevate-studio-browser-484736877039.us-central1.run.app';assert.equal(productionBrowserEnvironment(resource(url)).STUDIO_BROWSER_URL,url);});
test('preview aliases never become the production browser binding',()=>assert.throws(()=>productionBrowserEnvironment(resource('https://studio-verify---elevate-studio-browser-aabnh2y32a-uc.a.run.app')),/Canonical/));
test('missing, unrelated and credential-bearing destinations are refused',()=>{for(const url of [undefined,'http://elevate-studio-browser-aabnh2y32a-uc.a.run.app','https://other-service.run.app','https://elevate-studio-browser-foo.run.app.evil.test','https://operator:password@elevate-studio-browser-foo.run.app','https://elevate-studio-browser-foo.run.app/path','https://elevate-studio-browser-foo.run.app?preview=1'])assert.throws(()=>productionBrowserEnvironment(resource(url)));assert.throws(()=>productionBrowserEnvironment({metadata:{name:'other'},status:{url:origin}}));});

test('a matching pending template cannot certify an older serving Admin binding',async()=>{
 const {inspectServingAdminBrowserBinding}=await import('./production-browser-binding.mjs');
 const old='https://studio-verify---elevate-studio-browser-aabnh2y32a-uc.a.run.app';
 const env=value=>['STUDIO_BROWSER_URL','STUDIO_BROWSER_PUBLIC_URL'].map(name=>({name,value}));
 const run=args=>JSON.stringify(args[1]==='services'
  ? {spec:{template:{spec:{containers:[{env:env(origin)}]}}},status:{traffic:[{revisionName:'elevate-admin-migration-old',percent:100}]}}
  : {metadata:{name:args[3],labels:{'serving.knative.dev/service':'elevate-admin-migration'}},spec:{containers:[{env:env(old)}]}});
 const r=inspectServingAdminBrowserBinding({url:origin,run});
 assert.equal(r.verified,false);assert.equal(r.revisions[0].matches,false);
});

function bindingFixture(options={}){
 const old='elevate-admin-migration-old',next='elevate-admin-migration-next',sha='a'.repeat(40);
 const image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/admin@sha256:'+'b'.repeat(64);
 const env=value=>[...['STUDIO_BROWSER_URL','STUDIO_BROWSER_PUBLIC_URL'].map(name=>({name,value})),{name:'PRIVATE_KEY',valueFrom:{secretKeyRef:{name:'preserved-key',key:'latest'}}}];
 const spec={containers:[{image,env:env(options.already?origin:'https://studio-verify---old.run.app'),resources:{limits:{cpu:'2',memory:'4Gi'}}}],serviceAccountName:'unchanged'};
 const state={spec:{template:{spec:structuredClone(spec)}},status:{url:'https://elevate-admin-migration-aabnh2y32a-uc.a.run.app',latestCreatedRevisionName:old,latestReadyRevisionName:old,traffic:[{revisionName:old,percent:100}]}};
 const revision=(name,s)=>({metadata:{name,labels:{'serving.knative.dev/service':'elevate-admin-migration'}},spec:structuredClone(s)});
 const revisions={[old]:revision(old,spec)};
 if(options.pending)state.spec.template.spec.containers[0].image=image.replace(/b/g,'c');
 const writes=[],events=[];
 const run=args=>{
  if(args[1]==='services'&&args[2]==='describe')return JSON.stringify(state);
  if(args[1]==='revisions')return JSON.stringify(revisions[args[3]]);
  if(args[1]==='services'&&args[2]==='update'){
   writes.push(args);events.push('stage');assert.ok(args.includes('--no-traffic'));assert.ok(!args.some(a=>a.startsWith('--image=')));
   for(const e of state.spec.template.spec.containers[0].env)if(['STUDIO_BROWSER_URL','STUDIO_BROWSER_PUBLIC_URL'].includes(e.name))e.value=origin;
   if(options.drift)state.spec.template.spec.serviceAccountName='unexpected';
   state.status.latestCreatedRevisionName=next;state.status.latestReadyRevisionName=next;revisions[next]=revision(next,state.spec.template.spec);return '';
  }
  throw Error('Unexpected operation');
 };
 const input={url:origin,run,request:async()=>Response.json({service:'admin',healthy:!options.unhealthy,ready:true,commit:sha,revision:old,dependencies:{supabase:{ok:true}}}),
  preflight:async()=>{events.push('preflight');if(options.noCapacity)throw Error('CAPACITY');if(options.concurrent)state.spec.template.spec.serviceAccountName='concurrent';},
  activate:async receipt=>{events.push('activate');assert.deepEqual(receipt,{service:'elevate-admin-migration',revision:next,commit:sha});assert.equal(state.status.traffic[0].revisionName,old);if(options.activationFailure)throw Error('CANDIDATE_HEALTH_FAILED');if(!options.noPromotion)state.status.traffic=[{revisionName:next,percent:100}];}};
 return {input,writes,events,state};
}
test('binding cutover stages the same image, verifies health, activates and reads serving revision',async()=>{
 const {bindProductionStudioBrowser}=await import('./production-browser-binding.mjs');
 const f=bindingFixture();const result=await bindProductionStudioBrowser(f.input);
 assert.equal(result.adminSwitched,true);assert.equal(result.verified,true);
 assert.equal(result.revisions[0].revision,'elevate-admin-migration-next');
 assert.deepEqual(f.events,['preflight','stage','activate']);assert.equal(f.writes.length,1);
 assert.ok(!JSON.stringify(result).includes('PRIVATE_KEY'));
});
test('already serving bindings need no environment update, health request or activation',async()=>{
 const {bindProductionStudioBrowser}=await import('./production-browser-binding.mjs');
 const f=bindingFixture({already:true});f.input.request=()=>{throw Error('unnecessary request');};
 const result=await bindProductionStudioBrowser(f.input);
 assert.equal(result.adminConfigurationUpdated,false);assert.deepEqual(f.writes,[]);assert.deepEqual(f.events,[]);
});
test('pending images, unhealthy sources, capacity rejection and concurrent edits are never promoted',async()=>{
 const {bindProductionStudioBrowser}=await import('./production-browser-binding.mjs');
 for(const option of ['pending','unhealthy','noCapacity','concurrent']){
  const f=bindingFixture({[option]:true});await assert.rejects(bindProductionStudioBrowser(f.input));assert.equal(f.writes.length,0);assert.ok(!f.events.includes('activate'));
 }
});
test('unexpected staged runtime changes stop before activation',async()=>{
 const {bindProductionStudioBrowser}=await import('./production-browser-binding.mjs');
 const f=bindingFixture({drift:true});await assert.rejects(bindProductionStudioBrowser(f.input),/STAGED_BINDING_UNVERIFIED/);assert.ok(!f.events.includes('activate'));
});
test('failed candidate health or pinned traffic cannot produce a successful binding receipt',async()=>{
 const {bindProductionStudioBrowser}=await import('./production-browser-binding.mjs');
 for(const option of ['activationFailure','noPromotion']){
  const f=bindingFixture({[option]:true});await assert.rejects(bindProductionStudioBrowser(f.input),/HEALTH_FAILED|BINDING_NOT_SERVING/);
  assert.equal(f.state.status.traffic[0].revisionName,'elevate-admin-migration-old');
 }
});
