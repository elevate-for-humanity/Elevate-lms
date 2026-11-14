import test from 'node:test';
import assert from 'node:assert/strict';
import {KEYS,migrateStudioCloudflare} from './migrate-studio-cloudflare-config.mjs';
function fixture(options={}){
 let config={version:1,component:'admin',runtimeEnvironment:{NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fixture-role',UNRELATED:'preserve'},volumes:[],runtimeFiles:{}};
 const values={CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_AI_MODEL:'@cf/test/model',CLOUDFLARE_AI_API_TOKEN:'fixture-provider-token'};
 const writes=[],requests=[];let reads=0;
 const run=(args,input)=>{
  if(args.includes('add')){writes.push({args,input});config=JSON.parse(input);return JSON.stringify({name:'projects/484736877039/secrets/elevate-admin-runtime-config/versions/99'});}
  reads++;if(options.concurrent&&reads===2)return JSON.stringify({...config,runtimeFiles:{unexpected:'change'}});
  return JSON.stringify(config);
 };
 const request=async(url,init)=>{
  requests.push({url:String(url),init});let body;
  if(String(url).includes('api.cloudflare.com')){if(options.reject)return {ok:false,status:401};body={success:true,result:[{name:options.wrongModel?'@cf/wrong':values.CLOUDFLARE_AI_MODEL}]};}
  else if(String(url).includes('/rpc/'))body=values[JSON.parse(init.body).p_key];
  else body=KEYS.filter(key=>!options.missing||key!=='CLOUDFLARE_AI_API_TOKEN').map(key=>({key,scope:'runtime'}));
  return {ok:true,status:200,json:async()=>body};
 };
 return {run,request,writes,requests,values,get config(){return config;}};
}
test('validation performs only selected reads and never writes a config or runs inference',async()=>{
 const f=fixture(),r=await migrateStudioCloudflare(f);assert.equal(r.providerVerified,true);assert.equal(r.configurationChanged,false);assert.equal(f.writes.length,0);
 assert.deepEqual(f.requests.filter(x=>x.url.includes('/rpc/')).map(x=>JSON.parse(x.init.body).p_key),KEYS);
 assert.equal(f.requests.filter(x=>x.url.includes('api.cloudflare.com')).length,1);assert.ok(!f.requests.some(x=>x.url.includes('/ai/run/')));
 assert.ok(!JSON.stringify(r).includes(f.values.CLOUDFLARE_AI_API_TOKEN));
});
test('apply appends one verified config version with unrelated fields preserved and no deployment',async()=>{
 const f=fixture(),r=await migrateStudioCloudflare({...f,apply:true});assert.equal(f.writes.length,1);assert.equal(f.config.runtimeEnvironment.UNRELATED,'preserve');
 assert.equal(r.previousVersionsPreserved,true);assert.equal(r.applicationDeployed,false);assert.equal(r.trafficChanged,false);
 assert.deepEqual(f.writes[0].args.slice(0,4),['secrets','versions','add','elevate-admin-runtime-config']);assert.ok(f.writes[0].args.includes('--data-file=-'));
});
for(const options of [{reject:true},{wrongModel:true},{missing:true},{concurrent:true}])test('unsafe migration refuses writes: '+Object.keys(options)[0],async()=>{
 const f=fixture(options);await assert.rejects(migrateStudioCloudflare({...f,apply:true}));assert.equal(f.writes.length,0);
});
test('repeating an accepted migration does not create another version',async()=>{
 const f=fixture();await migrateStudioCloudflare({...f,apply:true});const result=await migrateStudioCloudflare({...f,apply:true});
 assert.equal(result.mode,'already-configured');assert.equal(f.writes.length,1);
});
