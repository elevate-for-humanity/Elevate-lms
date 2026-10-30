import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const raw=await fs.readFile(new URL('./gcp/repair-studio-browser-cloud-run.mjs',import.meta.url),'utf8');
const sha='a'.repeat(40), key='existing-encryption-key-no-production-access';
let serial=0;
async function execute(overrides={}){
 const f={commands:[],diagnostics:[],files:[],requests:[],events:[],state:{commit:sha,ready:true,providerAuthStorage:{persistent:true}},anonymous:401,authorized:200,...overrides};
 const output=args=>{
  f.commands.push(args);
  f.events.push({command:args});
  if(args[0]==='run'&&args[1]==='services'&&args[2]==='describe'&&args[3]==='elevate-admin-migration')return JSON.stringify({spec:{template:{spec:{containers:[{env:[{name:'STUDIO_BROWSER_SECRET',value:key}]}]}}}});
  if(args[0]==='secrets'&&args[1]==='list')return JSON.stringify(f.existingSecret?[{name:'existing'}]:[]);
  if(args[0]==='secrets'&&args[1]==='versions'&&args[2]==='access')return f.storedKey||key;
  if(args[0]==='storage'&&args[1]==='buckets'&&args[2]==='describe')return JSON.stringify({name:f.missingBucket?'unapproved':'elegant-racer-299721-studio-browser-auth'});
  if(args[0]==='artifacts')return 'sha256:'+sha+sha.slice(0,24);
  if(args[0]==='run'&&args[1]==='services'&&args[2]==='describe')return JSON.stringify({status:{url:'https://browser.example.run.app',latestCreatedRevisionName:'browser-candidate',traffic:[{revisionName:'browser-old',percent:100},{revisionName:'browser-candidate',tag:f.commands.find(a=>a[0]==='run'&&a[1]==='deploy')?.find(a=>a.startsWith('--tag='))?.slice(6),url:'https://candidate.example.test',percent:0}]},spec:{template:{spec:f.browserSpec}}});
  return '';
 };
 globalThis.__studioCutoverFixture={
  async bindProductionStudioBrowser({url}){if(f.adminBindingError)throw Error(f.adminBindingError);output(['run','services','update','elevate-admin-migration','--no-traffic','--update-env-vars=STUDIO_BROWSER_URL='+url]);return {adminSwitched:true,verified:true};},
  async verifyStudioRuntimeReplacement(options){f.replacementOptions=options;f.events.push({replacementProof:true});return f.replacement||{passed:true,runtimeReplaced:true,isolatedWorkspaceFileRestored:true};},
  async inventoryStudioLiveState(){return f.live||{activeBrowserSessions:0,workspace:{files:0,symlinks:0},directChildShells:0,directNonBrowserProcesses:0,processInventoryReadable:true};},
  async verifyStudioWorkspacePreservation(options){f.preservationOptions=options;f.events.push({workspacePreservation:true});if(!f.preservation)throw Error('STUDIO_LIVE_STATE_REQUIRES_PRESERVATION');return f.preservation;},
  execFileSync(_program,args){return output(args);},
  execFile(_program,args,_options,callback){f.diagnostics.push(args);callback(null,{stdout:args.includes('--format=value(status.latestCreatedRevisionName)')?'browser-failed-revision':args[0]==='run'?JSON.stringify({metadata:{name:'failed'},spec:{containers:[{env:[{name:'PRIVATE_TOKEN',value:'private-runtime-value'}]}]}}):JSON.stringify([{textPayload:'private-log-value',severity:'ERROR',timestamp:'2026-10-17T00:00:00Z'}])});},
  async mkdir(){},async writeFile(name,body){f.files.push({name,body});},
  process:{env:{IMAGE_SHA:sha,...(f.env||{})}},
  console:{log(){},error(){}},
  setTimeout(callback){return setTimeout(callback,0);},
  async fetch(url,options){
   f.requests.push(url);f.events.push({request:url});
   if(url.endsWith('/foundation-test'))return {ok:true,async json(){return f.foundation||{passed:true,commit:sha,checks:[{name:'fixture',passed:true}]};}};
   if(url.endsWith('/health'))return {ok:true,status:200,headers:{get(name){return name.toLowerCase()==='content-type'?'application/json; charset=utf-8':null;}},async json(){return url.startsWith('https://browser.example.run.app')&&f.publicState?f.publicState:f.state;}};
   const status=options?.headers?(options.headers['x-studio-browser-secret']===key?(url.startsWith('https://browser.example.run.app')?(f.canonicalAuthorized??200):f.authorized):401):f.anonymous;
   return {status,ok:status>=200&&status<300};
  },
 };
 const source=raw
  .replace("import {bindProductionStudioBrowser} from './production-browser-binding.mjs';","const bindProductionStudioBrowser=globalThis.__studioCutoverFixture.bindProductionStudioBrowser;")
  .replace("import {verifyStudioRuntimeReplacement} from './verify-studio-runtime-replacement.mjs';","const verifyStudioRuntimeReplacement=globalThis.__studioCutoverFixture.verifyStudioRuntimeReplacement;")
  .replace("import {inventoryStudioLiveState} from './inventory-studio-live-state.mjs';","const inventoryStudioLiveState=globalThis.__studioCutoverFixture.inventoryStudioLiveState;")
  .replace("import {verifyStudioWorkspacePreservation} from './verify-studio-workspace-preservation.mjs';","const verifyStudioWorkspacePreservation=globalThis.__studioCutoverFixture.verifyStudioWorkspacePreservation;")
  .replace("import {execFileSync, execFile} from 'node:child_process';","const {execFileSync,execFile,fetch,process,console,mkdir,writeFile,setTimeout}=globalThis.__studioCutoverFixture;")
  .replace("import {mkdir, writeFile} from 'node:fs/promises';","");
 try{await import('data:text/javascript;base64,'+Buffer.from(source+'\n// invocation '+serial++).toString('base64'));}catch(error){f.error=error;}
 return f;
}
function switched(f){return f.commands.some(a=>a[0]==='run'&&a[1]==='services'&&a[2]==='update'&&a[3]==='elevate-admin-migration');}

test('recovery verification receives the exact isolated deployment tag and release',async()=>{
 const f=await execute();assert.equal(f.error,undefined);
 const tag=f.commands.find(a=>a[0]==='run'&&a[1]==='deploy').find(a=>a.startsWith('--tag=')).slice(6);
 assert.equal(f.replacementOptions.candidateTag,tag);
 assert.equal(f.replacementOptions.sha,sha);
 assert.equal(f.replacementOptions.revision,'browser-candidate');
 assert.equal(f.replacementOptions.url,'https://candidate.example.test');
});
test('candidate hostname fits the Cloud Run service and traffic tag limit',async()=>{
 const f=await execute();assert.equal(f.error,undefined);
 const deploy=f.commands.find(a=>a[0]==='run'&&a[1]==='deploy');
 const tag=deploy.find(a=>a.startsWith('--tag=')).slice(6);
 assert.ok(tag.length+deploy[2].length<=46,'Cloud Run rejects combined service and tag names above 46 characters');
});
test('Admin cutover requires exact revision, durable storage and both authorization proofs',async()=>{
 const f=await execute();assert.equal(f.error,undefined);assert.equal(switched(f),true);
 const grants=f.commands.filter(a=>a[0]==='secrets'&&a[1]==='add-iam-policy-binding');
 assert.equal(grants.length,0);
 assert.ok(grants.every(a=>a.includes('studio-browser-shared-secret')));
});

test('new image deployments replace a stale runtime commit override with the exact immutable image SHA',async()=>{
 const f=await execute({browserSpec:{containers:[{env:[{name:'GIT_SHA',value:'old-release'}]}]}});
 assert.equal(f.error,undefined);
 const deploy=f.commands.find(a=>a[0]==='run'&&a[1]==='deploy');
 const env=deploy.find(a=>a.startsWith('--update-env-vars='));
 assert.ok(env.split(',').includes('GIT_SHA='+sha));
 assert.ok(!deploy.some(a=>a.startsWith('--set-env-vars=')));
});

test('production restoration overrides an inherited isolated acceptance workspace prefix',async()=>{
 const f=await execute({browserSpec:{containers:[{env:[{name:'STUDIO_WORKSPACE_OBJECT_PREFIX',value:'workspaces/acceptance-11111111-1111-1111-1111-111111111111'}]}]}});
 assert.equal(f.error,undefined);
 const deploy=f.commands.find(a=>a[0]==='run'&&a[1]==='deploy');
 const env=deploy.find(a=>a.startsWith('--update-env-vars='));
 assert.ok(env.slice('--update-env-vars='.length).split(',').includes('STUDIO_WORKSPACE_OBJECT_PREFIX=workspaces/admin-repository-v1'));
 assert.equal(f.commands.some(a=>a.includes('delete')),false);
});

test('unready persistent storage preserves Admin and collects exact revision diagnostics',async()=>{
 const f=await execute({state:{commit:sha,ready:true,providerAuthStorage:{persistent:false}}});
 assert.match(f.error.message,/not ready/);assert.equal(switched(f),false);
 const logs=f.diagnostics.find(a=>a[0]==='logging');assert.ok(logs);assert.match(logs[2],/revision_name="browser-failed-revision"/);
});

test('a failed production candidate releases only its unused tag and keeps the revision and serving traffic',async()=>{
 const f=await execute({foundation:{passed:false,commit:sha,checks:[]}});
 assert.match(f.error.message,/foundation evidence invalid/);
 const tag=f.commands.find(a=>a[0]==='run'&&a[1]==='deploy').find(a=>a.startsWith('--tag=')).slice(6);
 assert.ok(f.commands.some(a=>a.includes('--remove-tags='+tag)));
 assert.equal(f.commands.some(a=>a.includes('delete')||a.some(v=>v.startsWith('--to-revisions='))),false);
 assert.equal(switched(f),false);
});
test('anonymous workspace authorization regression prevents Admin cutover',async()=>{
 const f=await execute({anonymous:200});assert.match(f.error.message,/authorization boundary/);assert.equal(switched(f),false);
});
test('authenticated workspace failure prevents Admin cutover',async()=>{
 const f=await execute({authorized:401});assert.match(f.error.message,/Authenticated workspace/);assert.equal(switched(f),false);
});
test('existing encryption key mismatch never rotates key or deploys browser',async()=>{
 const f=await execute({existingSecret:true,storedKey:'different-key'});
 assert.match(f.error.message,/refusing credential rotation/);assert.equal(switched(f),false);
 assert.equal(f.commands.some(a=>a[0]==='run'&&a[1]==='deploy'),false);
 assert.equal(f.commands.some(a=>a[0]==='secrets'&&a[1]==='versions'&&a[2]==='add'),false);
});

test('browser releases preserve mounted storage and restored runtime settings',async()=>{
 const bucket='elegant-racer-299721-studio-browser-auth';
 const f=await execute({browserSpec:{containers:[{volumeMounts:[{name:'active',mountPath:'/var/lib/studio-browser-auth'}]}],
 volumes:[{name:'active',csi:{driver:'gcsfuse.run.googleapis.com',volumeAttributes:{bucketName:bucket}}},{name:'stale',csi:{driver:'gcsfuse.run.googleapis.com',volumeAttributes:{bucketName:bucket}}}]}});
 assert.equal(f.error,undefined);
 const deploy=f.commands.find(a=>a[0]==='run'&&a[1]==='deploy');
 assert.ok(deploy.some(a=>a.startsWith('--update-env-vars=')));
 assert.ok(!deploy.some(a=>a.startsWith('--set-env-vars=')||a.startsWith('--add-volume=')));
 assert.ok(deploy.includes('--remove-volume=stale'));
});

test('pinned old traffic is preserved until the exact candidate passes all proofs',async()=>{
 const f=await execute();assert.equal(f.error,undefined);
 const deploy=f.commands.find(a=>a[0]==='run'&&a[1]==='deploy');
 assert.ok(deploy.includes('--no-traffic'));assert.match(deploy.find(a=>a.startsWith('--tag=')),/^--tag=sc-[a-f0-9]{8}-[a-f0-9]{8}$/);
 const activation=f.events.findIndex(e=>e.command?.includes('--to-revisions=browser-candidate=100'));
 assert.ok(activation>0);
 const before=f.events.slice(0,activation).filter(e=>e.request).map(e=>e.request);
 assert.deepEqual(before,['https://browser.example.run.app/workspace/files','https://candidate.example.test/health','https://candidate.example.test/workspace/files','https://candidate.example.test/workspace/files','https://candidate.example.test/foundation-test']);
 assert.equal(f.events[activation+1].request,'https://browser.example.run.app/health');
});

test('failed public cutover restores previous traffic and leaves Admin unchanged',async()=>{
 const f=await execute({publicState:{commit:'old',ready:true,providerAuthStorage:{persistent:true}}});
 assert.match(f.error.message,/Public browser/);assert.equal(switched(f),false);
 const traffic=f.commands.filter(a=>a[2]==='update-traffic');
 assert.equal(traffic.length,2);assert.ok(traffic[0].includes('--to-revisions=browser-candidate=100'));
 assert.ok(traffic[1].includes('--to-revisions=browser-old=100'));
});

test('unready candidates never change serving traffic',async()=>{
 const f=await execute({state:{commit:sha,ready:false,providerAuthStorage:{persistent:true}}});
 assert.match(f.error.message,/not ready/);assert.equal(switched(f),false);
 assert.equal(f.commands.some(a=>a.some(v=>v.startsWith('--to-revisions='))),false);
});

test('browser candidate runs as the dedicated Studio identity rather than Admin',async()=>{
 const f=await execute();assert.equal(f.error,undefined);
 const deploy=f.commands.find(args=>args[0]==='run'&&args[1]==='deploy');
 assert.ok(deploy.includes('--service-account=elevate-studio-runtime@elegant-racer-299721.iam.gserviceaccount.com'));
 assert.equal(deploy.some(arg=>arg==='--service-account=elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com'),false);
});

test('migrated Studio releases verify their own encryption key without reading Admin credentials',async()=>{
 const f=await execute({existingSecret:true,browserSpec:{containers:[{env:[{name:'STUDIO_BROWSER_SECRET',valueFrom:{secretKeyRef:{name:'studio-browser-shared-secret',key:'latest'}}}]}]}});
 assert.equal(f.error,undefined);
 assert.equal(f.commands.some(a=>a[0]==='run'&&a[1]==='services'&&a[2]==='describe'&&a[3]==='elevate-admin-migration'),false);
 assert.ok(f.requests.includes('https://browser.example.run.app/workspace/files'));
});
test('canonical-key proof failure never deploys or rotates Studio credentials',async()=>{
 const f=await execute({existingSecret:true,canonicalAuthorized:401,browserSpec:{containers:[{env:[{name:'STUDIO_BROWSER_SECRET',valueFrom:{secretKeyRef:{name:'studio-browser-shared-secret',key:'latest'}}}]}]}});
 assert.match(f.error.message,/refusing credential rotation/);
 assert.equal(f.commands.some(a=>a[0]==='run'&&a[1]==='deploy'),false);
 assert.equal(f.commands.some(a=>a[0]==='secrets'&&a[1]==='versions'&&a[2]==='add'),false);
});

test('candidate acceptance leaves serving traffic and Admin untouched',async()=>{
 const f=await execute({env:{STUDIO_CANDIDATE_ONLY:'true'}});
 assert.equal(f.error,undefined);assert.equal(switched(f),false);
 assert.equal(f.commands.some(a=>a.some(v=>v.startsWith('--to-revisions='))),false);
 const tag=f.commands.find(a=>a[0]==='run'&&a[1]==='deploy').find(a=>a.startsWith('--tag=')).slice(6);
 assert.ok(f.commands.some(a=>a.includes('--remove-tags='+tag)));
 assert.ok(!f.commands.some(a=>a.includes('--remove-tags=studio-verify')));
 assert.equal(f.commands.some(a=>a.includes('delete')),false);
 assert.ok(f.requests.includes('https://candidate.example.test/health'));
 assert.equal(f.requests.filter(u=>u==='https://candidate.example.test/workspace/files').length,2);
});

test('live browser foundation failure preserves old traffic even when HTTP health passes',async()=>{
 const f=await execute({foundation:{passed:false,commit:sha,checks:[{name:'restore',passed:false}]}});
 assert.match(f.error.message,/foundation evidence invalid/);
 assert.equal(f.commands.some(a=>a.some(v=>v.startsWith('--to-revisions='))),false);assert.equal(switched(f),false);
});

test('routine candidate release never provisions identities, secrets or storage grants',async()=>{
 const f=await execute({env:{STUDIO_CANDIDATE_ONLY:'true'}});assert.equal(f.error,undefined);
 assert.equal(f.commands.some(a=>a.includes('add-iam-policy-binding')||a.includes('create')||(a[0]==='secrets'&&a.includes('add'))),false);
});
test('unprepared storage stops release without creating a replacement bucket',async()=>{const f=await execute({missingBucket:true});assert.match(f.error.message,/bucket is unverified/);assert.equal(f.commands.some(a=>a[0]==='run'&&a[1]==='deploy'),false);assert.equal(f.commands.some(a=>a.includes('create')),false);});

test('failed revision diagnostic artifacts omit runtime environment and log message contents',async()=>{const f=await execute({state:{commit:sha,ready:false,providerAuthStorage:{persistent:true}}});const serialized=JSON.stringify(f.files);assert.ok(f.files.length>0);assert.equal(serialized.includes('private-runtime-value'),false);assert.equal(serialized.includes('private-log-value'),false);});

test('HTTP health and browser foundation cannot replace full runtime recovery acceptance',async()=>{
 const f=await execute({replacement:{passed:false}});assert.match(f.error.message,/STUDIO_RUNTIME_REPLACEMENT_UNVERIFIED/);assert.equal(switched(f),false);assert.ok(!f.commands.some(a=>a.includes('--to-revisions=browser-candidate=100')));
});
test('a passing replacement proof never discards existing serving workspace files',async()=>{
 const f=await execute({live:{activeBrowserSessions:0,workspace:{files:1,symlinks:0},directChildShells:0,directNonBrowserProcesses:0,processInventoryReadable:true}});assert.match(f.error.message,/STUDIO_LIVE_STATE_REQUIRES_PRESERVATION/);assert.equal(switched(f),false);assert.ok(!f.commands.some(a=>a.includes('--to-revisions=browser-candidate=100')));
});

test('nonempty workspaces can switch only after exact durable file preservation is verified',async()=>{
 const f=await execute({live:{activeBrowserSessions:0,workspace:{files:13943,symlinks:0},directChildShells:0,directNonBrowserProcesses:0,processInventoryReadable:true},preservation:{passed:true,files:13943}});
 assert.equal(f.error,undefined);assert.equal(switched(f),true);
 const proof=f.events.findIndex(e=>e.workspacePreservation);
 const activation=f.events.findIndex(e=>e.command?.includes('--to-revisions=browser-candidate=100'));
 assert.ok(proof>=0&&proof<activation);
 assert.equal(f.preservationOptions.sourceUrl,'https://browser.example.run.app');
 assert.equal(f.preservationOptions.candidateUrl,'https://candidate.example.test');
});

test('repeated verification of the same image uses a fresh tag and never reuses the active browser alias',async()=>{
 const first=await execute({env:{STUDIO_CANDIDATE_ONLY:'true'}}),second=await execute({env:{STUDIO_CANDIDATE_ONLY:'true'}});
 for(const f of [first,second])assert.equal(f.error,undefined);
 const tag=f=>f.commands.find(a=>a[0]==='run'&&a[1]==='deploy').find(a=>a.startsWith('--tag='));
 assert.notEqual(tag(first),tag(second));
 assert.notEqual(tag(first),'--tag=studio-verify');
 assert.notEqual(tag(second),'--tag=studio-verify');
});

test('an unverified serving Admin binding fails the cutover instead of claiming it switched',async()=>{
 const f=await execute({adminBindingError:'STUDIO_ADMIN_BINDING_NOT_SERVING'});
 assert.match(f.error.message,/STUDIO_ADMIN_BINDING_NOT_SERVING/);
});
