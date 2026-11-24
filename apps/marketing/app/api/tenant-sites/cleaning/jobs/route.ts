// pre-auth-registry: exempt - Authenticated customer booking, tenant and user scoped.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cleaningContext, cleaningHandler, verifiedCustomer, sameOrigin, reply, rpc, CLEANING_SITE, serviceSchema, CleaningError } from '@/lib/cleaning/server';
import { cleaningInvoice } from '@/lib/cleaning/billing';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:NextRequest){return cleaningHandler(async()=>{
 const {db,user}=await cleaningContext(request);const actor=verifiedCustomer(user);
 const {data,error}=await db.from('cleaning_jobs').select('id,service,zip,starts_at,status,summary,customer_cents,base_cents,discount_cents,quote_expires_at,private_details').eq('website_id',CLEANING_SITE).eq('customer_id',actor.id).order('created_at',{ascending:false}).limit(50);if(error)throw error;return reply({jobs:data});
});}
export async function POST(request:NextRequest){return cleaningHandler(async()=>{
 sameOrigin(request);const {db,user}=await cleaningContext(request);const actor=verifiedCustomer(user);const raw=await request.json();
 if(raw.action==='cancel'){
  const input=z.object({id:z.uuid(),confirm:z.literal(true)}).parse(raw);
  const owned=await db.from('cleaning_jobs').select('id').eq('id',input.id).eq('website_id',CLEANING_SITE).eq('customer_id',actor.id).maybeSingle();if(owned.error)throw owned.error;if(!owned.data)throw new CleaningError('Request not found.',404);
  return reply({status:await rpc(db,'cleaning_cancel_job',{p_job_id:input.id,p_website_id:CLEANING_SITE})});
 }
 if(raw.action==='checkout'){
  const input=z.object({id:z.uuid()}).parse(raw);
  const {data:job,error}=await db.from('cleaning_jobs').select('*').eq('id',input.id).eq('website_id',CLEANING_SITE).eq('customer_id',actor.id).maybeSingle();if(error)throw error;
  if(!job||job.status!=='quoted'||Date.parse(job.quote_expires_at)<=Date.now())throw new CleaningError('This quote is unavailable. Contact 2Exclusive for an updated quote.',409);
  const {data:providers,error:pe}=await db.from('cleaning_providers').select('id').eq('website_id',CLEANING_SITE).eq('eligibility','eligible').eq('opted_in',true).contains('zips',[job.zip]).contains('services',[job.service]).lte('hourly_cents',job.hourly_cents).limit(1);if(pe)throw pe;
  if(!providers?.length)throw new CleaningError('A matching provider must be available before this quote can be paid. Contact 2Exclusive.',409);
  return reply(await cleaningInvoice(db,{key:`cleaning-job:${job.id}`,email:actor.email,name:job.customer_name,amount:job.customer_cents,type:'cleaning_job',recordId:job.id}));
 }
 const input=z.object({requestKey:z.uuid(),name:z.string().trim().min(2).max(160),service:serviceSchema,zip:z.string().regex(/^\d{5}$/),startsAt:z.iso.datetime(),details:z.string().trim().min(10).max(4000)}).parse(raw);
 if(Date.parse(input.startsAt)<Date.now()+86400000)throw new CleaningError('Choose a date at least 24 hours away. Contact us for urgent requests.');
 const saved=await db.from('cleaning_jobs').upsert({website_id:CLEANING_SITE,customer_id:actor.id,request_key:input.requestKey,customer_email:actor.email,customer_name:input.name,service:input.service,zip:input.zip,starts_at:input.startsAt,private_details:input.details},{onConflict:'website_id,customer_id,request_key',ignoreDuplicates:true}).select('id').maybeSingle();if(saved.error)throw saved.error;
 let id=saved.data?.id;if(!id){const existing=await db.from('cleaning_jobs').select('id').eq('website_id',CLEANING_SITE).eq('customer_id',actor.id).eq('request_key',input.requestKey).single();if(existing.error)throw existing.error;id=existing.data.id;}
 const notice=await db.from('cleaning_outbox').upsert({website_id:CLEANING_SITE,job_id:id,kind:'request',dedupe_key:`request:${id}`},{onConflict:'dedupe_key',ignoreDuplicates:true});if(notice.error)throw notice.error;
 return reply({id,received:true});
});}
