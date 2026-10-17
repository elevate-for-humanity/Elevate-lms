import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const raw=await fs.readFile(new URL('./gcp/repair-studio-browser-cloud-run.mjs',import.meta.url),'utf8');
const sha='a'.repeat(40), key='existing-encryption-key-no-production-access';
let serial=0;
async function execute(overrides={}){
 const f={commands:[],diagnostics:[],requests:[],events:[],state:{commit:sha,ready:true,providerAuthStorage:{persistent:true}},anonymous:401,authorized:200,...overrides};
 const output=args=>{
  f.commands.push(args);
  f.events.push({command:args});
  if(args[0]==='run'&&args[1]==='services'&&args[2]==='describe'&&args[3]==='elevate-admin-migration')return JSON.stringify({spec:{template:{spec:{containers:[{env:[{name:'STUDIO_BROWSER_SECRET',value:key}]}]}}}});
  if(args[0]==='secrets'&&args[1]==='list')return JSON.stringify(f.existingSecret?[{name:'existing'}]:[]);
  if(args[0]==='secrets'&&args[1]==='versions'&&args[2]==='access')return f.storedKey||key;
  if(args[0]==='storage'&&args[1]==='buckets'&&args[2]==='list')return '[]';
  if(args[0]==='artifacts')return 'sha256:'+sha+sha.slice(0,24);
  if(args[0]==='run'&&args[1]==='services'&&args[2]==='describe')return JSON.stringify({status:{url:'https://browser.example.test',latestCreatedRevisionName:'browser-candidate',traffic:[{revisionName:'browser-old',percent:100},{revisionName:'browser-candidate',tag:'studio-verify',url:'https://candidate.example.test',percent:0}]},spec:{template:{spec:f.browserSpec}}});
  return '';
 };
 globalThis.__studioCutoverFixture={
  execFileSync(_program,args){return output(args);},
  execFile(_program,args,_options,callback){f.diagnostics.push(args);callback(null,{stdout:args.includes('--format=value(status.latestCreatedRevisionName)')?'browser-failed-revision':'{}'});},
  async mkdir(){},async writeFile(){},
  process:{env:{IMAGE_SHA:sha}},
  console:{log(){},error(){}},
  setTimeout(callback){return setTimeout(callback,0);},
  async fetch(url,options){
   f.requests.push(url);f.events.push({request:url});
   if(url.endsWith('/health'))return {ok:true,status:200,headers:{get(name){return name.toLowerCase()==='content-type'?'application/json; charset=utf-8':null;}},async json(){return url.startsWith('https://browser.example.test')&&f.publicState?f.publicState:f.state;}};
   const status=options?.headers?f.authorized:f.anonymous;
   return {status,ok:status>=200&&status<300};
  },
 };
 const source=raw
  .replace("import {execFileSync, execFile} from 'node:child_process';","const {execFileSync,execFile,fetch,process,console,mkdir,writeFile,setTimeout}=globalThis.__studioCutoverFixture;")
  .replace("import {mkdir, writeFile} from 'node:fs/promises';","");
 try{await import('data:text/javascript;base64,'+Buffer.from(source+'\n// invocation '+serial++).toString('base64'));}catch(error){f.error=error;}
 return f;
}
function switched(f){return f.commands.some(a=>a[0]==='run'&&a[1]==='services'&&a[2]==='update'&&a[3]==='elevate-admin-migration');}
test('Admin cutover requires exact revision, durable storage and both authorization proofs',async()=>{
 const f=await execute();assert.equal(f.error,undefined);assert.equal(switched(f),true);
 const grants=f.commands.filter(a=>a[0]==='secrets'&&a[1]==='add-iam-policy-binding');
 assert.equal(grants.length,2);
 assert.ok(grants.every(a=>a.includes('studio-browser-shared-secret')));
});
test('unready persistent storage preserves Admin and collects exact revision diagnostics',async()=>{
 const f=await execute({state:{commit:sha,ready:true,providerAuthStorage:{persistent:false}}});
 assert.match(f.error.message,/not ready/);assert.equal(switched(f),false);
 const logs=f.diagnostics.find(a=>a[0]==='logging');assert.ok(logs);assert.match(logs[2],/revision_name="browser-failed-revision"/);
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
 assert.ok(deploy.includes('--no-traffic'));assert.ok(deploy.includes('--tag=studio-verify'));
 const activation=f.events.findIndex(e=>e.command?.includes('--to-revisions=browser-candidate=100'));
 assert.ok(activation>0);
 const before=f.events.slice(0,activation).filter(e=>e.request).map(e=>e.request);
 assert.deepEqual(before,['https://candidate.example.test/health','https://candidate.example.test/workspace/files','https://candidate.example.test/workspace/files']);
 assert.equal(f.events[activation+1].request,'https://browser.example.test/health');
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
 assert.equal(f.commands.some(a=>a[2]==='update-traffic'),false);
});
