import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSecrets,PREPARE_PERMISSIONS,SECRET_NAMES} from './prepare-pbx-secrets.mjs';
const project='elegant-racer-299721';
function fixture(existing=false){
 const calls=[];
 const run=(args,input)=>{
  calls.push({args,input});
  if(args[0]==='compute')return JSON.stringify({name:'elevate-pbx',serviceAccounts:[{email:`pbx@${project}.iam.gserviceaccount.com`}]});
  if(args[0]==='secrets' && args[1]==='versions' && args[2]==='access')return JSON.stringify({version:1,component:'lms',runtimeEnvironment:{NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-key'.repeat(5)},volumes:[],runtimeFiles:{}});
  if(args[0]==='secrets' && args[1]==='list')return JSON.stringify(existing?Object.values(SECRET_NAMES).map(name=>({name:`projects/${project}/secrets/${name}`,labels:{elevate_component:'pbx'}})):[]);
  if(args[1]==='versions' && args[2]==='list')return existing?'1':'';
  if(args[1]==='versions' && args[2]==='add')return '1';
  return '';
 };
 return {calls,run,request:async()=>({permissions:PREPARE_PERMISSIONS}),entropy:()=> 'new-test-token'.repeat(4),apply:true};
}
test('missing bootstrap permissions do not read credentials or mutate infrastructure',async()=>{
 const f=fixture();f.request=async()=>({permissions:[]});
 const result=await prepareSecrets(f);assert.equal(result.result,'BLOCKED');assert.deepEqual(result.missing,PREPARE_PERMISSIONS);assert.deepEqual(f.calls,[]);
});
test('existing versions are never overwritten or rotated',async()=>{
 const f=fixture(true);const result=await prepareSecrets(f);assert.equal(result.result,'PASS');
 assert.equal(f.calls.some(x=>x.args[1]==='create'||x.args[2]==='add'),false);
 assert.equal(JSON.stringify(result).includes('test-only-key'),false);
});
test('new secrets use stdin and exact per-secret grants, not project-wide secret access',async()=>{
 const f=fixture();const result=await prepareSecrets(f);
 const versions=f.calls.filter(x=>x.args[1]==='versions' && x.args[2]==='add');assert.equal(versions.length,4);
 for(const v of versions){assert.ok(v.args.includes('--data-file=-'));assert.ok(v.input.length>=32);assert.equal(v.args.includes(v.input),false);}
 assert.equal(f.calls.some(x=>x.args[0]==='projects' && x.args.some(a=>/secretmanager/.test(a))),false);
 assert.equal(Object.keys(result.versions).length,4);assert.equal(JSON.stringify(result).includes('test-only'),false);
});
