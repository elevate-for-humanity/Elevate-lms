import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyStripeProvider} from './verify-stripe-provider.mjs';
const key='sk_live_fixture_secret';
const input={component:'lms',env:{STRIPE_SECRET_KEY:key}};
const account={id:'acct_1OKSVyH4a2yrVOt5',charges_enabled:true,payouts_enabled:true};

test('verifies the configured live account using one read-only request without leaking credentials',async()=>{
 const calls=[];
 const result=await verifyStripeProvider({...input,request:async(url,options)=>{
  calls.push({url,options});return new Response(JSON.stringify(account),{status:200});
 }});
 assert.equal(result.ready,true);assert.equal(result.accountMatched,true);
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.stripe.com/v1/account');
 assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].options.redirect,'error');
 assert.equal(calls[0].options.headers.Authorization,'Bearer '+key);
 assert.ok(calls[0].options.signal instanceof AbortSignal);
 assert.equal(JSON.stringify(result).includes(key),false);
 assert.equal(JSON.stringify(result).includes(account.id),false);
});
test('missing and test-mode credentials cannot call the live provider',async()=>{
 for(const env of [{},{STRIPE_SECRET_KEY:'sk_test_fixture'}]){
  const result=await verifyStripeProvider({...input,env,request:async()=>{throw Error('unexpected request')}});
  assert.equal(result.ready,false);assert.equal(result.providerAuthenticated,undefined);
 }
});
test('an unexpected account or disabled financial capabilities cannot pass',async()=>{
 for(const value of [{...account,id:'acct_other'},{...account,charges_enabled:false},{...account,payouts_enabled:false},{}]){
  const result=await verifyStripeProvider({...input,request:async()=>new Response(JSON.stringify(value))});
  assert.equal(result.ready,false);
 }
});
test('provider permissions and HTTP failures remain explicit without response bodies',async()=>{
 for(const status of [401,403,429,500]){
  const result=await verifyStripeProvider({...input,request:async()=>new Response(key,{status})});
  assert.equal(result.ready,false);assert.equal(result.httpStatus,status);
  assert.equal(JSON.stringify(result).includes(key),false);
 }
});
test('transport errors and malformed JSON expose no keys, tokens or provider payloads',async()=>{
 for(const request of [async()=>{throw Error('Bearer '+key)},async()=>new Response('private '+key)]){
  const result=await verifyStripeProvider({...input,request});
  assert.equal(result.ready,false);assert.equal(JSON.stringify(result).includes(key),false);
 }
});
test('only managed payment components can read configured provider credentials',async()=>{
 await assert.rejects(verifyStripeProvider({...input,component:'store'}),/Managed Stripe component required/);
});
