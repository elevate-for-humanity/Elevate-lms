import test from 'node:test';
import assert from 'node:assert/strict';
import {syncAdminGitHubToken} from './sync-admin-github-token.mjs';
const token='github_pat_fixture_never_log',bootstrap='bootstrap_fixture';
function fixture({reject=false,owner=true,deny=false,concurrent=false}={}){
 const writes=[],requests=[],activations=[];let reads=0,changed=false;
 const cfg={version:1,component:'admin',runtimeEnvironment:{NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:bootstrap,GITHUB_TOKEN:'expired',UNCHANGED:'preserved'},runtimeFiles:{},volumes:[]};
 const state=()=>({metadata:{generation:changed?'2':'1'},spec:{template:{spec:{containers:[{image:'image@sha256:'+'b'.repeat(64),env:changed?[{name:'GITHUB_TOKEN',valueFrom:{secretKeyRef:{name:'elevate-admin-github-token',key:'7'}}}]:[]}]}}},status:{latestReadyRevisionName:'elevate-admin-migration-old',latestCreatedRevisionName:changed?'elevate-admin-migration-new':'elevate-admin-migration-old',traffic:[{revisionName:'elevate-admin-migration-old',percent:100}]}});
 const deps={config:()=>{reads++;return structuredClone(concurrent&&reads>1?{...cfg,extra:'concurrent'}:cfg);},
  request:async(url,init)=>{requests.push({url,init});if(url.includes('/rpc/'))return Response.json(token);if(url.includes('api.github.com'))return Response.json({}, {status:reject?401:200});return Response.json({service:'admin',healthy:true,revision:'elevate-admin-migration-old',commit:'a'.repeat(40)});},
  run:(args,input)=>{
   if(args[0]==='secrets'&&args[1]==='describe')return JSON.stringify({labels:{elevate_component:owner?'admin':'other',elevate_key:'github_token'}});
   if(args[0]==='secrets'&&args[1]==='versions'){writes.push({args,input});if(deny)throw Object.assign(Error(token),{code:'permission_denied'});return JSON.stringify({name:'projects/484736877039/secrets/'+args[3]+'/versions/7',state:'ENABLED'});}
   if(args[0]==='run'&&args[2]==='update'){writes.push({args,input});changed=true;return '{}';}
   if(args[0]==='run'&&args[2]==='describe')return JSON.stringify(state());throw Error('Unexpected operation');},
  activate:async args=>{activations.push(args);},};
 return{deps,writes,requests,activations,cfg};
}
test('read-only preflight authenticates the canonical Admin token without any writes',async()=>{const f=fixture();const result=await syncAdminGitHubToken(f.deps);assert.equal(result.stateChanged,false);assert.equal(f.writes.length,0);assert.equal(f.requests[1].init.headers.Authorization,'Bearer '+token);assert.ok(f.requests.every(r=>r.init.redirect==='error'));assert.ok(!JSON.stringify(result).includes(token));});
test('rejected source token and wrong secret owner fail before any write',async()=>{for(const options of [{reject:true},{owner:false}]){const f=fixture(options);await assert.rejects(syncAdminGitHubToken({...f.deps,apply:true}));assert.equal(f.writes.length,0);}});
test('sync preserves other settings, image and App configuration, pins a version, then verifies activation',async()=>{const f=fixture();const result=await syncAdminGitHubToken({...f.deps,apply:true});assert.equal(f.writes.length,3);assert.equal(f.writes[0].input,token);const config=JSON.parse(f.writes[1].input);assert.equal(config.runtimeEnvironment.GITHUB_TOKEN,token);assert.equal(config.runtimeEnvironment.UNCHANGED,'preserved');assert.deepEqual(config.runtimeFiles,{});assert.ok(f.writes[2].args.includes('--no-traffic'));assert.ok(f.writes[2].args.includes('--update-secrets=GITHUB_TOKEN=elevate-admin-github-token:7'));assert.ok(!f.writes[2].args.some(a=>a.startsWith('--image')||a.includes(token)));assert.equal(f.activations[0].commit,'a'.repeat(40));assert.equal(result.appSigningKeyChanged,false);assert.ok(!JSON.stringify(result).includes(token));});
test('denied secret writes cannot update configuration or runtime traffic',async()=>{const f=fixture({deny:true});await assert.rejects(syncAdminGitHubToken({...f.deps,apply:true}),{code:'permission_denied'});assert.equal(f.writes.length,1);assert.equal(f.activations.length,0);});
test('concurrent config updates are preserved and stop the runtime change',async()=>{const f=fixture({concurrent:true});await assert.rejects(syncAdminGitHubToken({...f.deps,apply:true}),/CONFIG_CHANGED_CONCURRENTLY/);assert.equal(f.writes.length,1);assert.equal(f.activations.length,0);});
