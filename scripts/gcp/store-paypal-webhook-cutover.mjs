export const STORE_PAYPAL_CALLBACK='https://store.elevateforhumanity.org/api/webhooks/paypal-billing';
const fail=code=>{throw Error('STORE_PAYPAL_'+code);};
// PayPal may reorder events and vary descriptive metadata between reads.
// Compare the exact subscription names, rejecting missing or duplicate names.
export function eventSubscriptionIdentity(events){
 if(!Array.isArray(events)||!events.length)fail('CUTOVER_EVENT_TYPES_INVALID');
 const names=events.map(e=>e?.name);
 if(names.some(n=>typeof n!=='string'||!n.trim()||n!==n.trim())||new Set(names).size!==names.length)fail('CUTOVER_EVENT_TYPES_INVALID');
 return JSON.stringify(names.sort());
}
/** Provider URL cutover only: no subscriptions, orders, charges or account changes.
 * Called with the existing verified app token. Never log that token or payloads. */
export async function cutoverStorePayPalWebhook({request=fetch,base,token,hook,expectedSha,apply=false}={}){
 if(!['https://api-m.paypal.com','https://api-m.sandbox.paypal.com'].includes(base)||!token||!hook?.id||!Array.isArray(hook.event_types))fail('CUTOVER_PROVIDER_INVALID');
 if(!/^[a-f0-9]{40}$/.test(expectedSha??''))fail('CUTOVER_SOURCE_REQUIRED');
 const original=new URL(hook.url);
 if(original.protocol!=='https:'||original.username||original.password||original.search||original.hash||!(original.hostname==='elevateforhumanity.org'||original.hostname.endsWith('.elevateforhumanity.org')))fail('CUTOVER_ORIGINAL_URL_INVALID');
 async function call(url,options={}){
  let r;try{r=await request(url,{...options,redirect:'error',signal:AbortSignal.timeout(20000)});}catch{fail('CUTOVER_REQUEST_FAILED');}
  return r;
 }
 const origin=new URL(STORE_PAYPAL_CALLBACK).origin;
 const version=await call(origin+'/api/version?acceptance='+expectedSha);
 if(version.status!==200)fail('CUTOVER_STORE_VERSION_UNAVAILABLE');
 const v=await version.json();
 if(v.service!=='store'||(v.commit??v.commitSha)!==expectedSha)fail('CUTOVER_STORE_SOURCE_MISMATCH');
 const ready=await call(origin+'/api/ready?acceptance='+expectedSha);
 if(ready.status!==200)fail('CUTOVER_STORE_NOT_READY');
 const r=await ready.json();if(r.service!=='store'||r.ready!==true)fail('CUTOVER_STORE_NOT_READY');
 // This malformed event cannot reserve a billing event, call a payment API or
 // alter customer data. Redirects, generic 400s and Marketing fallbacks fail.
 const probe=await call(STORE_PAYPAL_CALLBACK,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
 if(probe.status!==400)fail('CUTOVER_CALLBACK_UNAVAILABLE');
 const p=await probe.json();if(p.error!=='Invalid PayPal event.')fail('CUTOVER_CALLBACK_UNVERIFIED');
 const url=base+'/v1/notifications/webhooks/'+encodeURIComponent(hook.id);
 const headers={Authorization:'Bearer '+token,'content-type':'application/json'};
 const currentResponse=await call(url,{headers});if(!currentResponse.ok)fail('CUTOVER_PROVIDER_READ_FAILED');
 const current=await currentResponse.json();
 if(current.id!==hook.id)fail('CUTOVER_WEBHOOK_ID_CHANGED');
 if(current.url!==hook.url)fail('CUTOVER_REGISTRATION_CHANGED');
 if(eventSubscriptionIdentity(current.event_types)!==eventSubscriptionIdentity(hook.event_types))fail('CUTOVER_EVENT_SUBSCRIPTIONS_CHANGED');
 const receipt={callbackVerified:true,sourceVerified:true,webhookUsesStoreOrigin:hook.url===STORE_PAYPAL_CALLBACK,webhookChanged:false,transactionsCreated:0,commerceAccepted:false};
 if(!apply||hook.url===STORE_PAYPAL_CALLBACK)return {...receipt,mode:apply?'already-routed':'validate-only'};
 const patched=await call(url,{method:'PATCH',headers,body:JSON.stringify([{op:'replace',path:'/url',value:STORE_PAYPAL_CALLBACK}])});
 if(!patched.ok)fail('CUTOVER_PROVIDER_UPDATE_FAILED');
 const readback=await call(url,{headers});if(!readback.ok)fail('CUTOVER_READBACK_REQUIRED');
 const saved=await readback.json();
 if(saved.id!==hook.id||saved.url!==STORE_PAYPAL_CALLBACK||eventSubscriptionIdentity(saved.event_types)!==eventSubscriptionIdentity(hook.event_types))fail('CUTOVER_READBACK_REQUIRED');
 return {...receipt,mode:'applied',webhookUsesStoreOrigin:true,webhookChanged:true,previousUrl:hook.url};
}
