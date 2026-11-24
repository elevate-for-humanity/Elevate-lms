import 'server-only';
import { sendEmail } from '@/lib/email/sendgrid';
import { CLEANING_SITE,CLEANING_URL } from './server';
import { money } from './pricing';
const escape=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function processCleaningOutbox(db:any){
 const enabled=await db.from('user_websites').select('site_config').eq('id',CLEANING_SITE).maybeSingle();
 if(enabled.error)throw enabled.error;
 if(enabled.data?.site_config?.meta?.cleaningNetworkEnabled!==true)return {sent:0,held:0};
 const expired=await db.rpc('cleaning_expire_quotes',{p_website_id:CLEANING_SITE});if(expired.error)throw new Error('Cleaning quote expiry failed.');
 // An interrupted or uncertain send is held for human review, never blindly retried.
 const stale=await db.from('cleaning_outbox').update({status:'unknown',error:'Delivery interrupted; review transport logs before resending.'}).eq('website_id',CLEANING_SITE).eq('status','sending').lt('attempted_at',new Date(Date.now()-600000).toISOString());if(stale.error)throw stale.error;
 const {data:rows,error}=await db.from('cleaning_outbox').select('*').eq('website_id',CLEANING_SITE).eq('status','pending').order('created_at').limit(3);if(error)throw error;
 let sent=0,held=0;
 for(const row of rows||[]){
  const claim=await db.from('cleaning_outbox').update({status:'sending',attempted_at:new Date().toISOString()}).eq('id',row.id).eq('status','pending').select('id').maybeSingle();if(claim.error)throw claim.error;if(!claim.data)continue;
  try{
   const {data:job,error:je}=await db.from('cleaning_jobs').select('*').eq('id',row.job_id).eq('website_id',CLEANING_SITE).single();if(je)throw je;
   const {data:site,error:se}=await db.from('user_websites').select('site_config').eq('id',CLEANING_SITE).single();if(se)throw se;
   const operator=site.site_config?.contact?.email;if(!operator)throw new Error('Operator email missing.');
   let recipient=operator,subject='2Exclusive cleaning request update';let text=`A cleaning request needs review. Status: ${job.status}. Service: ${job.service}. ZIP: ${job.zip}. Start: ${job.starts_at}. Open the cleaning network dashboard. Job reference: ${job.id}.`;
   if(row.kind==='offer'){
    const {data:offer,error:oe}=await db.from('cleaning_offers').select('*').eq('id',row.offer_id).eq('website_id',CLEANING_SITE).single();if(oe)throw oe;
    const {data:provider,error:pe}=await db.from('cleaning_providers').select('email,eligibility,opted_in').eq('id',offer.provider_id).eq('website_id',CLEANING_SITE).single();if(pe)throw pe;
    if(job.status!=='offered'||offer.status!=='open'||Date.parse(offer.expires_at)<=Date.now()||provider.eligibility!=='eligible'||!provider.opted_in){const stopped=await db.from('cleaning_outbox').update({status:'suppressed',capability:null}).eq('id',row.id);if(stopped.error)throw stopped.error;continue;}
    if(!/^[a-f0-9]{64}$/.test(row.capability||''))throw new Error('Offer capability unavailable.');
    recipient=provider.email;subject='Cleaning opportunity — review scope and accept';
    text=`Service: ${job.service}\nZIP: ${job.zip}\nStart: ${job.starts_at}\nScope: ${job.summary}\nTotal cleaner-hours: ${job.cleaner_hours}\nYour business receives: ${money(job.provider_pay_cents)} before your own expenses and taxes.\nReview and accept before ${offer.expires_at}:\n${CLEANING_URL}/accept-job?offer=${offer.id}#token=${row.capability}\nThe first eligible provider to confirm acceptance receives the assignment. Customer contact and access details are shared after acceptance.`;
   }else if(row.kind==='quote'){
    if(job.status!=='quoted'){const stopped=await db.from('cleaning_outbox').update({status:'suppressed'}).eq('id',row.id);if(stopped.error)throw stopped.error;continue;}
    recipient=job.customer_email;subject='Your 2Exclusive cleaning quote is ready';text=`Your cleaning quote is ${money(job.customer_cents)}, including ${money(job.discount_cents)} in membership savings. Review the scope, schedule and quote expiry before paying:\n${CLEANING_URL}/book-cleaning\nSign in with the email used for your request. Job reference: ${job.id}.`;
   }else if(row.kind==='assigned_customer'||row.kind==='assigned_operator'){
    if(!['assigned','completed'].includes(job.status))throw new Error('Assignment is no longer active; review notification.');
    const {data:provider,error:pe}=await db.from('cleaning_providers').select('name,email').eq('id',job.provider_id).eq('website_id',CLEANING_SITE).single();if(pe)throw pe;
    recipient=row.kind==='assigned_customer'?job.customer_email:operator;subject='Your cleaning assignment is confirmed';text=`Provider: ${provider.name}\nProvider email: ${provider.email}\nService: ${job.service}\nStart: ${job.starts_at}\nJob reference: ${job.id}\nView your booking at ${CLEANING_URL}/book-cleaning`;
   }
   const link=row.kind==='offer'?`${CLEANING_URL}/accept-job?offer=${row.offer_id}#token=${row.capability}`:row.kind==='request'?`https://www.elevateforhumanity.org/apps/website-builder/edit/${CLEANING_SITE}/network`:`${CLEANING_URL}/book-cleaning`;
   const result=await sendEmail({to:recipient,replyTo:operator,subject,text,html:`<div style="white-space:pre-wrap">${escape(text)}</div><p><a href="${escape(link)}">Review cleaning details</a></p>`,singleAttempt:true});
   const saved=await db.from('cleaning_outbox').update({status:result.success?'sent':'unknown',sent_at:result.success?new Date().toISOString():null,capability:result.success?null:row.capability,error:result.success?null:'Transport did not confirm delivery. Review before retrying.'}).eq('id',row.id).eq('status','sending');if(saved.error)throw saved.error;
   if(result.success)sent++;else held++;
  }catch{held++;await db.from('cleaning_outbox').update({status:'unknown',error:'Delivery requires operator review; no automatic resend.'}).eq('id',row.id).eq('status','sending');}
 }
 return {sent,held};
}
