import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateStorePayPal,PAYPAL_KEYS} from './migrate-store-paypal-config.mjs';
function fixture({conflict=false,deny=false,badHook=false,rotate=false,concurrent=false,badReadback=false}={}){
 const values={PAYPAL_CLIENT_ID:'canonical-private-client',PAYPAL_CLIENT_SECRET:'canonical-private-secret',PAYPAL_ENVIRONMENT:'production',PAYPAL_BILLING_WEBHOOK_ID:'canonical-private-hook'};
 const config=component=>({version:1,component,runtimeFiles:{},volumes:[],runtimeEnvironment:component==='store'?{UNRELATED:'preserved',...(conflict?{PAYPAL_CLIENT_ID:'different-client'}:{})}:{NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-source-key'}});
 let store=config('store'),reads=0;const writes=[],requests=[],seen={};
 return {writes,requests,values,run(args,input){
  if(args.includes('add')){writes.push({args,input});store=JSON.parse(input);return JSON.stringify({name:'projects/484736877039/secrets/elevate-store-runtime-config/versions/18'});}
  if(args.join(' ').includes('elevate-marketing-runtime-config'))return JSON.stringify(config('marketing'));
  if(args.join(' ').includes('elevate-store-runtime-config')){reads++;if(concurrent&&reads===2)return JSON.stringify({...store,extra:'concurrent-change'});if(badReadback&&writes.length)return JSON.stringify(config('store'));return JSON.stringify(store);}
  throw Error('Unexpected operation');
 },async request(url,options){
  requests.push({url:String(url),method:options.method||'GET'});
  if(String(url).includes('/rpc/')){const key=JSON.parse(options.body).p_key;assert.ok(PAYPAL_KEYS.includes(key));seen[key]=(seen[key]||0)+1;return Response.json(rotate&&seen[key]>1?'rotated-value':values[key]);}
  if(String(url).endsWith('/v1/oauth2/token')){
   assert.equal(options.body,'grant_type=client_credentials');assert.equal(options.redirect,'error');
   return deny?new Response('{}',{status:401}):Response.json({access_token:'private-ephemeral-token'});
  }
  assert.match(String(url),/^https:\/\/api-m.paypal.com\/v1\/notifications\/webhooks\//);
  return Response.json({id:badHook?'wrong-hook':values.PAYPAL_BILLING_WEBHOOK_ID,url:'https://www.elevateforhumanity.org/api/paypal/subscriptions/webhook',event_types:[{name:'BILLING.SUBSCRIPTION.CANCELLED'}]});
 }};
}
test('dry run verifies canonical app authorization and registered subscription webhook without writes',async()=>{const f=fixture(),r=await migrateStorePayPal(f);assert.equal(r.providerAuthorizationVerified,true);assert.equal(r.webhookRegistrationVerified,true);assert.equal(r.webhookUsesStoreOrigin,false);assert.equal(r.commerceAccepted,false);assert.equal(r.transactionsCreated,0);assert.equal(f.writes.length,0);assert.ok(f.requests.every(x=>x.url.includes('/rpc/')||x.url.includes('/oauth2/token')||x.method==='GET'));assert.ok(!JSON.stringify(r).includes('private'));});
test('apply archives only the verified family, preserves rollback, and never changes inheritance or runtime',async()=>{const f=fixture(),r=await migrateStorePayPal({...f,apply:true});assert.equal(f.writes.length,1);const saved=JSON.parse(f.writes[0].input);assert.equal(saved.runtimeEnvironment.UNRELATED,'preserved');for(const k of PAYPAL_KEYS)assert.equal(saved.runtimeEnvironment[k],f.values[k]);assert.equal(saved.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY,undefined);assert.equal(saved.storeConfigurationIndependent,undefined);assert.equal(r.applicationDeployed,false);assert.equal(r.previousVersionsPreserved,true);assert.ok(f.writes[0].args.includes('--data-file=-'));});
for(const [name,options,code] of [
 ['conflicting Store merchant',{conflict:true},/EXISTING_CONFIGURATION_CONFLICT/],
 ['provider rejection',{deny:true},/PROVIDER_HTTP_401/],
 ['webhook belonging to another app',{badHook:true},/WEBHOOK_UNVERIFIED/],
 ['concurrent Google change',{concurrent:true},/CONFIG_CHANGED/],
 ['canonical rotation',{rotate:true},/CANONICAL_CHANGED/],
])test('refuses '+name+' before writes',async()=>{const f=fixture(options);await assert.rejects(migrateStorePayPal({...f,apply:true}),code);assert.equal(f.writes.length,0);});
test('incorrect exact readback fails without reporting acceptance',async()=>{const f=fixture({badReadback:true});await assert.rejects(migrateStorePayPal({...f,apply:true}),/READBACK_FAILED/);assert.equal(f.writes.length,1);});
test('provider exception text never escapes as a credential-bearing failure',async()=>{const f=fixture();await assert.rejects(migrateStorePayPal({...f,request:async()=>{throw Error('private-token');}}),e=>e.message==='STORE_PAYPAL_PROVIDER_UNREACHABLE');assert.equal(f.writes.length,0);});
