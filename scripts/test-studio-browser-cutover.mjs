import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const raw=await fs.readFile(new URL('./gcp/repair-studio-browser-cloud-run.mjs',import.meta.url),'utf8');
const sha='a'.repeat(40), key='existing-encryption-key-no-production-access';
let serial=0;
async function execute(overrides={}){
 const f={commands:[],diagnostics:[],state:{commit:sha,ready:true,providerAuthStorage:{persistent:true}},anonymous:401,authorized:200,...overrides};
 const output=args=>{
  f.commands.push(args);
  if(args[0]==='run'&&args[1]==='services'&&args[2]==='describe'&&args[3]==='elevate-admin-migration')return JSON.stringify({spec:{template:{spec:{containers:[{env:[{name:'STUDIO_BROWSER_SECRET',value:key}]}]}}}});
  if(args[0]==='secrets'&&args[1]==='list')return JSON.stringify(f.existingSecret?[{name:'existing'}]:[]);
  if(args[0]==='secrets'&&args[1]==='versions'&&args[2]==='access')return f.storedKey||key;
  if(args[0]==='storage'&&args[1]==='buckets'&&args[2]==='list')return '[]';
  if(args[0]==='artifacts')return 'sha256:'+sha+sha.slice(0,24);
  if(args[0]==='run'&&args[1]==='services'&&args[2]==='describe')return JSON.stringify({status:{url:'https://browser.example.test'}});
  return '';
 };
 globalThis.__studioCutoverFixture={
  execFileSync(_program,args){return output(args);},
  execFile(_program,args,_options,callback){f.diagnostics.push(args);callback(null,{stdout:args.includes('--format=value(status.latestCreatedRevisionName)')?'browser-failed-revision':'{}'});},
  async mkdir(){},async writeFile(){},
  process:{env:{IMAGE_SHA:sha}},
  console:{log(){},error(){}},
  async fetch(url,options){
   if(url.endsWith('/health'))return {ok:true,async json(){return f.state;}};
   const status=options?.headers?f.authorized:f.anonymous;
   return {status,ok:status>=200&&status<300};
  },
 };
 const source=raw
  .replace("import {execFileSync, execFile} from 'node:child_process';","const {execFileSync,execFile,fetch,process,console,mkdir,writeFile}=globalThis.__studioCutoverFixture;")
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
