// pre-auth-registry: exempt - Session-authenticated tenant membership with exact website scope.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cleaningContext, cleaningHandler, verifiedCustomer, sameOrigin, reply, rpc, CLEANING_SITE, CleaningError } from '@/lib/cleaning/server';
import { cleaningInvoice } from '@/lib/cleaning/billing';
export const runtime='nodejs'; export const dynamic='force-dynamic';
export async function GET(request: NextRequest) { return cleaningHandler(async()=>{
  const {db,user}=await cleaningContext(request); const actor=verifiedCustomer(user);
  const {data:m,error}=await db.from('cleaning_memberships').select('id,canceled_at').eq('website_id',CLEANING_SITE).eq('user_id',actor.id).maybeSingle();
  if(error) throw error; if(!m) return reply({ membership:null });
  const {data:periods,error:pe}=await db.from('cleaning_member_periods').select('id,invoice_id,ends_at').eq('membership_id',m.id).lte('starts_at',new Date().toISOString()).gt('ends_at',new Date().toISOString()).order('ends_at',{ascending:false}).limit(1);
  if(pe)throw pe; const p=periods?.[0]; let active=false; let used=0;
  if(p){const {data:invoice,error:ie}=await db.from('billing_invoices').select('status').eq('id',p.invoice_id).maybeSingle();if(ie)throw ie;active=invoice?.status==='paid';
    const {data:ledger,error:le}=await db.from('cleaning_discount_ledger').select('amount_cents').eq('period_id',p.id).in('status',['reserved','consumed']);if(le)throw le;
    used=(ledger||[]).reduce((sum:number,row:any)=>sum+row.amount_cents,0);}
  return reply({membership:{active,canceled:!!m.canceled_at,endsAt:active?p.ends_at:null,remainingSavingsCents:active?Math.max(0,5000-used):0}});
});}
export async function POST(request: NextRequest) { return cleaningHandler(async()=>{
  sameOrigin(request);const {db,user}=await cleaningContext(request);const actor=verifiedCustomer(user);
  const body=z.object({action:z.enum(['checkout','cancel']),name:z.string().trim().min(2).max(160).optional(),consent:z.boolean().optional()}).parse(await request.json());
  const initial=await db.from('cleaning_memberships').select('id,name,canceled_at').eq('website_id',CLEANING_SITE).eq('user_id',actor.id).maybeSingle();if(initial.error)throw initial.error;let m=initial.data;
  if(body.action==='cancel'){if(!m)throw new CleaningError('Membership not found.',404);await rpc(db,'cleaning_cancel_membership',{p_membership_id:m.id,p_user_id:actor.id});return reply({cancelled:true});}
  if(body.consent!==true||!body.name)throw new CleaningError('Confirm the membership terms and enter your name.');
  if(!m){const inserted=await db.from('cleaning_memberships').upsert({website_id:CLEANING_SITE,user_id:actor.id,email:actor.email,name:body.name},{onConflict:'website_id,user_id',ignoreDuplicates:true}).select('id,name,canceled_at').maybeSingle();if(inserted.error)throw inserted.error;
    m=inserted.data;if(!m){const retry=await db.from('cleaning_memberships').select('id,name,canceled_at').eq('website_id',CLEANING_SITE).eq('user_id',actor.id).single();if(retry.error)throw retry.error;m=retry.data;}}
  const {data:period,error:pe}=await db.from('cleaning_member_periods').select('id').eq('membership_id',m.id).gt('ends_at',new Date().toISOString()).limit(1);if(pe)throw pe;
  if(period?.length)throw new CleaningError('You already have a paid membership period. Review membership status before another purchase.',409);
  if(m.canceled_at)throw new CleaningError('Contact 2Exclusive to restart your cancelled membership.',409);
  const {data:unpaid,error:ue}=await db.from('billing_invoices').select('payment_url,status').eq('fulfillment_type','cleaning_membership').contains('fulfillment_payload',{membership_id:m.id}).in('status',['draft','open','past_due']).order('created_at',{ascending:false}).limit(1);if(ue)throw ue;
  if(unpaid?.[0]){if(unpaid[0].payment_url?.startsWith('https://'))return reply({checkoutUrl:unpaid[0].payment_url});throw new CleaningError('Your invoice is being prepared. Please retry shortly.',409);}
  return reply(await cleaningInvoice(db,{key:`cleaning-membership:${m.id}:${new Date().toISOString().slice(0,7)}`,email:actor.email,name:body.name,amount:1900,type:'cleaning_membership',recordId:m.id}));
});}
