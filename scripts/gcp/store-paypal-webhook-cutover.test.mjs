import test from 'node:test';
import assert from 'node:assert/strict';
import {cutoverStorePayPalWebhook,STORE_PAYPAL_CALLBACK,eventSubscriptionIdentity} from './store-paypal-webhook-cutover.mjs';
const sha='a'.repeat(40),hook={id:'fixture-hook',url:'https://www.elevateforhumanity.org/api/webhooks/paypal-billing',event_types:[{name:'BILLING.SUBSCRIPTION.CANCELLED'},{name:'PAYMENT.SALE.COMPLETED'}]};
function fixture({wrongSource=false,redirect=false,badCallback=false,concurrent=false,reordered=false,eventsChanged=false}={}){
 const calls=[];let saved=structuredClone(hook);
 return {calls,base:'https://api-m.paypal.com',token:'fixture-token',hook,expectedSha:sha,async request(url,o){calls.push({url,method:o.method??'GET',body:o.body});assert.equal(o.redirect,'error');
 if(url.includes('/api/version'))return Response.json({service:wrongSource?'marketing':'store',commit:sha});
 if(url.includes('/api/ready'))return Response.json({service:'store',ready:true});
 if(url===STORE_PAYPAL_CALLBACK)return Response.json({error:badCallback?'generic':'Invalid PayPal event.'},{status:redirect?307:400});
 if(o.method==='PATCH'){const changes=JSON.parse(o.body);assert.deepEqual(changes,[{op:'replace',path:'/url',value:STORE_PAYPAL_CALLBACK}]);saved.url=STORE_PAYPAL_CALLBACK;return Response.json(saved);}
 const current=structuredClone(saved);if(eventsChanged)current.event_types=[{name:'BILLING.SUBSCRIPTION.ACTIVATED'}];if(reordered)current.event_types.reverse().forEach(e=>e.description='Provider display metadata');
 return Response.json(concurrent?{...current,url:'https://elevateforhumanity.org/changed'}:current);
 }};
}
test('read-only acceptance proves exact Store source and callback without changing provider',async()=>{const f=fixture(),r=await cutoverStorePayPalWebhook(f);assert.equal(r.callbackVerified,true);assert.equal(r.webhookChanged,false);assert.equal(f.calls.some(c=>c.method==='PATCH'),false);});
test('cutover changes only URL and preserves the same webhook ID and events',async()=>{const f=fixture(),r=await cutoverStorePayPalWebhook({...f,apply:true});assert.equal(r.webhookChanged,true);assert.equal(r.transactionsCreated,0);assert.equal(r.commerceAccepted,false);assert.equal(f.calls.filter(c=>c.method==='PATCH').length,1);assert.equal(JSON.stringify(r).includes('fixture-token'),false);});
for(const [name,options] of [['Marketing fallback',{wrongSource:true}],['redirect',{redirect:true}],['generic callback',{badCallback:true}],['concurrent provider change',{concurrent:true}],['changed event subscriptions',{eventsChanged:true}]])test('refuses '+name+' before provider mutation',async()=>{const f=fixture(options);await assert.rejects(cutoverStorePayPalWebhook({...f,apply:true}));assert.equal(f.calls.some(c=>c.method==='PATCH'),false);});
test('missing source acceptance never makes a request',async()=>{const f=fixture();await assert.rejects(cutoverStorePayPalWebhook({...f,expectedSha:null,apply:true}));assert.equal(f.calls.length,0);});

test('event ordering and provider display metadata do not constitute a registration change',async()=>{const f=fixture({reordered:true});const r=await cutoverStorePayPalWebhook({...f,apply:true});assert.equal(r.webhookChanged,true);assert.equal(f.calls.filter(c=>c.method==='PATCH').length,1);});

test('subscription comparison rejects actual name changes, empty entries and duplicates',()=>{assert.notEqual(eventSubscriptionIdentity(hook.event_types),eventSubscriptionIdentity([{name:'BILLING.SUBSCRIPTION.ACTIVATED'}]));for(const values of [[],[{name:''}],[{name:'event'},{name:'event'}],null])assert.throws(()=>eventSubscriptionIdentity(values));});
