import 'server-only';
import { hashCapability, newCapability, rpc, CLEANING_SITE } from './server';
export async function fulfillCleaningPayment(db:any,type:string,invoiceId:string){
 if(type==='cleaning_membership')return rpc(db,'cleaning_activate_membership',{p_invoice_id:invoiceId});
 const jobId=await rpc(db,'cleaning_mark_job_paid',{p_invoice_id:invoiceId});
 const {data:job,error}=await db.from('cleaning_jobs').select('zip,service,hourly_cents,status').eq('id',jobId).eq('website_id',CLEANING_SITE).single();if(error)throw error;
 if(job.status==='offered'){
 const {data:providers,error:pe}=await db.from('cleaning_providers').select('id').eq('website_id',CLEANING_SITE).eq('eligibility','eligible').eq('opted_in',true).contains('zips',[job.zip]).contains('services',[job.service]).lte('hourly_cents',job.hourly_cents).limit(200);if(pe)throw pe;
 for(const provider of providers||[]){const capability=newCapability();await rpc(db,'cleaning_queue_offer',{p_job_id:jobId,p_provider_id:provider.id,p_hash:hashCapability(capability),p_capability:capability});}
 }
 // An operator sees every paid job, including a job whose eligible providers changed after checkout.
 const notice=await db.from('cleaning_outbox').upsert({website_id:CLEANING_SITE,job_id:jobId,kind:'request',dedupe_key:`paid-job:${jobId}`},{onConflict:'dedupe_key',ignoreDuplicates:true});if(notice.error)throw notice.error;
}
