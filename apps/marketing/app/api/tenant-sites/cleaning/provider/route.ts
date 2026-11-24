// pre-auth-registry: exempt - Verified provider email owns only its hourly rate, never eligibility.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cleaningContext,cleaningHandler,verifiedCustomer,sameOrigin,reply,CLEANING_SITE,CleaningError } from '@/lib/cleaning/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:NextRequest){return cleaningHandler(async()=>{
 const {db,user}=await cleaningContext(request);const actor=verifiedCustomer(user);
 const {data,error}=await db.from('cleaning_providers').select('id,name,hourly_cents,zips,services,eligibility,opted_in').eq('website_id',CLEANING_SITE).eq('email',actor.email).maybeSingle();if(error)throw error;
 let jobs:any[]=[];if(data?.eligibility==='eligible'){const assigned=await db.from('cleaning_jobs').select('id,service,starts_at,summary,customer_name,customer_email,private_details,provider_pay_cents,status').eq('website_id',CLEANING_SITE).eq('provider_id',data.id).in('status',['assigned','completed']).order('starts_at',{ascending:false}).limit(30);if(assigned.error)throw assigned.error;jobs=assigned.data||[];}
 return reply({provider:data,jobs});
});}
export async function POST(request:NextRequest){return cleaningHandler(async()=>{
 sameOrigin(request);const {db,user}=await cleaningContext(request);const actor=verifiedCustomer(user);
 const input=z.object({hourlyCents:z.number().int().min(1500).max(20000)}).parse(await request.json());
 const saved=await db.from('cleaning_providers').update({hourly_cents:input.hourlyCents}).eq('website_id',CLEANING_SITE).eq('email',actor.email).select('id').maybeSingle();if(saved.error)throw saved.error;if(!saved.data)throw new CleaningError('Your application must first be added to the provider directory.',409);
 return reply({saved:true});
});}
