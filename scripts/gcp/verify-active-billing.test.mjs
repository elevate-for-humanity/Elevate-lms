import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyActiveBilling} from './verify-active-billing.mjs';

const config={runtimeEnvironment:{NEXT_PUBLIC_SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-db-key'}};
const paypalReceipt={environment:'production',providerAuthorizationVerified:true,webhookRegistrationVerified:true,webhookUsesStoreOrigin:true,configurationChanged:false,transactionsCreated:0};
function fixture({provider='quickbooks',health={service:'quickbooks',ready:true,configured:true,connected:true,webhookVerifierConfigured:true},paypal=paypalReceipt}={}){
 const calls=[];
 return {calls,options:{readConfig:()=>config,request:async(url,options)=>{
  calls.push({url:String(url),options});
  if(String(url).includes('/rest/v1/platform_settings'))return Response.json([{key:'billing_provider',value:provider}]);
  assert.equal(String(url),'https://www.elevateforhumanity.org/api/health/quickbooks');
  assert.equal(options.headers?.Authorization,undefined);
  return Response.json(health,{status:health.ready?200:503});
 },verifyPayPal:async options=>{assert.equal(options.apply,false);assert.equal(options.routeMode,'none');return paypal;}}};
}
test('verifies canonical QuickBooks billing and PayPal recurring collection without contacting Stripe',async()=>{
 const f=fixture();const result=await verifyActiveBilling(f.options);
 assert.equal(result.ready,true);assert.equal(result.primary,'quickbooks');assert.equal(result.recurring.provider,'paypal');
 assert.equal(result.transactionsCreated,0);assert.equal(result.configurationChanged,false);
 assert.ok(f.calls.every(call=>call.options.method==='GET'&&!call.url.includes('stripe')));
 assert.ok(!JSON.stringify(result).includes('private-db-key'));
});
test('retired or ambiguous billing selection cannot silently pass',async()=>{
 for(const provider of ['stripe','unknown','paypal']){
  const f=fixture({provider});const result=await verifyActiveBilling(f.options);
  assert.equal(result.ready,false);assert.equal(result.error,'BILLING_AUTHORITY_MISMATCH');assert.equal(f.calls.length,1);
 }
});
test('expired QuickBooks authorization and missing webhook verification remain failures',async()=>{
 for(const health of [{service:'quickbooks',ready:false,connected:false,reason:'oauth_reauthorization_required'},{service:'quickbooks',ready:false,connected:true,webhookVerifierConfigured:false,reason:'webhook_verifier_missing'}]){
  const result=await verifyActiveBilling(fixture({health}).options);assert.equal(result.ready,false);assert.equal(result.invoices.ready,false);assert.equal(result.invoices.reason,health.reason);
 }
});
test('PayPal authorization alone cannot certify webhook routing or a purchase',async()=>{
 const result=await verifyActiveBilling(fixture({paypal:{...paypalReceipt,webhookUsesStoreOrigin:false}}).options);
 assert.equal(result.ready,false);assert.equal(result.recurring.ready,false);assert.equal(result.transactionsCreated,0);
});
test('sandbox payment credentials cannot certify production billing',async()=>{
 const result=await verifyActiveBilling(fixture({paypal:{...paypalReceipt,environment:'sandbox'}}).options);
 assert.equal(result.ready,false);assert.equal(result.recurring.production,false);
});
test('provider and database errors never expose payloads or secrets',async()=>{
 const f=fixture();f.options.request=async()=>{throw Error('private-db-key private-provider-payload');};
 const result=await verifyActiveBilling(f.options);assert.equal(result.ready,false);assert.ok(!JSON.stringify(result).includes('private'));
 const bad=fixture();bad.options.verifyPayPal=async()=>{throw Error('private-provider-token');};
 const second=await verifyActiveBilling(bad.options);assert.equal(second.ready,false);assert.equal(second.recurring.error,'PAYPAL_VERIFICATION_UNAVAILABLE');
});
