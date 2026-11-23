// pre-auth-registry: exempt - Expiring hashed provider capability; GET never accepts a job.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cleaningContext,cleaningHandler,sameOrigin,reply,rpc,hashCapability,CLEANING_SITE,CleaningError } from '@/lib/cleaning/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
async function requireCleaningOffer(request:NextRequest){
 const context=await cleaningContext(request);const id=z.uuid().parse(request.nextUrl.searchParams.get('id'));
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';if(!/^[a-f0-9]{64}$/.test(token))throw new CleaningError('Offer link unavailable.',403);
 const hash=hashCapability(token);
 const {data:offer,error}=await context.db.from('cleaning_offers').select('id,job_id,status,expires_at,provider_id').eq('id',id).eq('website_id',CLEANING_SITE).eq('token_hash',hash).maybeSingle();if(error)throw error;if(!offer||Date.parse(offer.expires_at)<=Date.now())throw new CleaningError('This offer link has expired or is unavailable.',403);
 const provider=await context.db.from('cleaning_providers').select('eligibility,opted_in').eq('id',offer.provider_id).eq('website_id',CLEANING_SITE).maybeSingle();
 if(provider.error||provider.data?.eligibility!=='eligible'||!provider.data?.opted_in)throw new CleaningError('This provider offer has been withdrawn.',403);
 return {...context,offer,hash};
}
export async function GET(request:NextRequest){return cleaningHandler(async()=>{
 const {db,offer}=await requireCleaningOffer(request);
 const {data:job,error}=await db.from('cleaning_jobs').select('service,zip,starts_at,summary,provider_pay_cents,cleaner_hours,status,private_details,customer_name,customer_email,provider_id').eq('id',offer.job_id).eq('website_id',CLEANING_SITE).single();if(error)throw error;
 if(offer.status==='accepted'&&job.provider_id===offer.provider_id&&['assigned','completed'].includes(job.status))return reply({accepted:true,job:{service:job.service,zip:job.zip,starts_at:job.starts_at,summary:job.summary,provider_pay_cents:job.provider_pay_cents,private_details:job.private_details,customer_name:job.customer_name,customer_email:job.customer_email}});
 if(offer.status!=='open'||job.status!=='offered')throw new CleaningError('This job is no longer available.',409);
 return reply({job:{service:job.service,zip:job.zip,starts_at:job.starts_at,summary:job.summary,provider_pay_cents:job.provider_pay_cents,cleaner_hours:job.cleaner_hours},expiresAt:offer.expires_at});
});}
export async function POST(request:NextRequest){return cleaningHandler(async()=>{
 sameOrigin(request);const {db,offer,hash}=await requireCleaningOffer(request);
 const body=z.object({confirm:z.literal(true)}).parse(await request.json());void body;
 return reply({accepted:true,job:await rpc(db,'cleaning_accept_offer',{p_offer_id:offer.id,p_website_id:CLEANING_SITE,p_token_hash:hash})});
});}
