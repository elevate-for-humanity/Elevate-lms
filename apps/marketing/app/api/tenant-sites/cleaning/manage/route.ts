import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireCleaningOwner,cleaningHandler,sameOrigin,reply,rpc,CLEANING_SITE,serviceSchema,CleaningError,newCapability,hashCapability } from '@/lib/cleaning/server';
import { processCleaningOutbox } from '@/lib/cleaning/outbox';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:NextRequest){return cleaningHandler(async()=>{
 const {db}=await requireCleaningOwner(request);
 const results=await Promise.all([
  db.from('cleaning_providers').select('id,lead_id,name,email,hourly_cents,zips,services,opted_in,eligibility,review_note').eq('website_id',CLEANING_SITE).order('created_at',{ascending:false}).limit(200),
  db.from('cleaning_jobs').select('id,customer_name,customer_email,service,zip,starts_at,status,private_details,summary,customer_cents,discount_cents,provider_pay_cents,provider_id').eq('website_id',CLEANING_SITE).order('created_at',{ascending:false}).limit(100),
  db.from('cleaning_outbox').select('id,job_id,kind,status,error,created_at').eq('website_id',CLEANING_SITE).order('created_at',{ascending:false}).limit(100),
  db.from('tenant_site_leads').select('id,name,email,message').eq('website_id',CLEANING_SITE).like('source_path','%/join-network').not('name','ilike','%test%').order('created_at',{ascending:false}).limit(200),
  db.from('cleaning_member_periods').select('id,starts_at,ends_at,cleaning_memberships!inner(website_id,name,email),billing_invoices!inner(total_cents,status)').eq('cleaning_memberships.website_id',CLEANING_SITE).order('starts_at',{ascending:false}).limit(100),
  db.from('cleaning_job_accounts').select('job_id,collected_cents,provider_payable_cents,discount_cents,platform_gross_cents,status,payment_reference,cleaning_jobs!inner(website_id)').eq('cleaning_jobs.website_id',CLEANING_SITE).order('created_at',{ascending:false}).limit(100),
 ]);
 for(const result of results)if(result.error)throw result.error;
 return reply({providers:results[0].data,jobs:results[1].data,deliveries:results[2].data,applications:results[3].data,membershipPayments:results[4].data,accounts:results[5].data});
});}
export async function POST(request:NextRequest){return cleaningHandler(async()=>{
 sameOrigin(request);const {db,user}=await requireCleaningOwner(request);const raw=await request.json();
 if(raw.action==='import'){
  const input=z.object({leadId:z.uuid(),hourlyCents:z.number().int().min(1500).max(20000),zips:z.array(z.string().regex(/^\d{5}$/)).min(1).max(100),services:z.array(serviceSchema).min(1).max(7)}).parse(raw);
  const {data:lead,error}=await db.from('tenant_site_leads').select('id,name,email,message,source_path').eq('id',input.leadId).eq('website_id',CLEANING_SITE).maybeSingle();if(error)throw error;
  if(!lead||!/\/join-network$/.test(lead.source_path||'')||/test/i.test(lead.name))throw new CleaningError('Select a genuine network application.',404);
  const company=lead.message.match(/Company name, if applicable:\s*([^\n]+)/)?.[1]||lead.name;
  const saved=await db.from('cleaning_providers').insert({website_id:CLEANING_SITE,lead_id:lead.id,name:company.slice(0,200),email:lead.email.toLowerCase(),hourly_cents:input.hourlyCents,zips:input.zips,services:input.services});if(saved.error)throw new CleaningError('This application may already be in the directory. Refresh before retrying.',409);
  return reply({imported:true,eligibility:'pending'});
 }
 if(raw.action==='review'){
  const input=z.object({id:z.uuid(),eligibility:z.enum(['eligible','suspended']),optedIn:z.boolean(),note:z.string().trim().min(10).max(2000),verified:z.literal(true)}).parse(raw);
  if(input.eligibility==='eligible'&&!input.optedIn)throw new CleaningError('Provider permission to receive job emails is required.');
  const saved=await db.from('cleaning_providers').update({eligibility:input.eligibility,opted_in:input.optedIn,review_note:input.note,reviewed_by:user!.id,reviewed_at:new Date().toISOString()}).eq('id',input.id).eq('website_id',CLEANING_SITE).select('id').maybeSingle();if(saved.error)throw saved.error;if(!saved.data)throw new CleaningError('Provider not found.',404);return reply({reviewed:true});
 }
 if(raw.action==='quote'){
  const input=z.object({id:z.uuid(),hourlyCents:z.number().int().min(1500).max(20000),hours:z.number().min(2).max(200),durationHours:z.number().min(0.25).max(200),summary:z.string().trim().min(5).max(1000)}).parse(raw);
  return reply({quote:await rpc(db,'cleaning_quote_job',{p_job_id:input.id,p_website_id:CLEANING_SITE,p_hourly_cents:input.hourlyCents,p_hours:input.hours,p_summary:input.summary,p_duration_hours:input.durationHours})});
 }
 if(raw.action==='complete'){
  const input=z.object({id:z.uuid(),note:z.string().trim().min(5).max(2000)}).parse(raw);await rpc(db,'cleaning_complete_job',{p_job_id:input.id,p_website_id:CLEANING_SITE,p_note:input.note});return reply({completed:true});
 }
 if(raw.action==='cancel'){
  const input=z.object({id:z.uuid()}).parse(raw);return reply({status:await rpc(db,'cleaning_cancel_job',{p_job_id:input.id,p_website_id:CLEANING_SITE})});
 }
 if(raw.action==='retryDelivery'){
  const input=z.object({id:z.uuid(),confirmedNotDelivered:z.literal(true),note:z.string().trim().min(10).max(2000)}).parse(raw);
  const row=await db.from('cleaning_outbox').select('id').eq('id',input.id).eq('website_id',CLEANING_SITE).maybeSingle();if(row.error)throw row.error;if(!row.data)throw new CleaningError('Delivery not found.',404);
  const token=newCapability();await rpc(db,'cleaning_reissue_delivery',{p_outbox_id:input.id,p_actor:user!.id,p_note:input.note,p_capability:token,p_hash:hashCapability(token)});return reply({reissued:true});
 }
 if(raw.action==='flush')return reply(await processCleaningOutbox(db));
 throw new CleaningError('Unknown cleaning action.');
});}
