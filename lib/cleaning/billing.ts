import 'server-only';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { getMarketplaceBillingReadiness } from '@/lib/billing/marketplace-readiness';
import { CleaningError, CLEANING_SITE } from './server';

export async function cleaningInvoice(db: any, input: {
  key: string; email: string; name: string; amount: number; type: 'cleaning_membership'|'cleaning_job'; recordId: string;
}) {
  const network = await db.from('cleaning_providers').select('id').eq('website_id',CLEANING_SITE).eq('eligibility','eligible').eq('opted_in',true).limit(1);
  if(network.error||!network.data?.length)throw new CleaningError('Provider review must be completed before online purchases can begin. Contact 2Exclusive.',409);
  const readiness = await getMarketplaceBillingReadiness(db);
  if (!readiness.ready) throw new CleaningError('Online invoices are temporarily unavailable. Contact 2Exclusive for assistance.',503);
  const result = await createQuickBooksBillingProvider(db).createManualInvoice({
    idempotencyKey:input.key, customer:{ externalKey:`cleaning:${input.email}`,displayName:input.name,email:input.email },
    lines:[{ canonicalKey:input.type==='cleaning_membership'?'platinum-cleaning-membership':'platinum-cleaning-service',
      name:input.type==='cleaning_membership'?'Platinum Cleaning Membership':'2Exclusive Cleaning Service',
      description:input.type==='cleaning_membership'?'One month. Cleaning separate. 10% eligible discount, $50 monthly cap. Cancel future invoices online.':`Cleaning job ${input.recordId}; agreed scope and schedule shown in your booking.`,
      quantity:1,unitAmountCents:input.amount }],
    dueDate:new Date().toISOString().slice(0,10),
    fulfillment:{type:input.type,payload:{ website_id:CLEANING_SITE,[input.type==='cleaning_membership'?'membership_id':'job_id']:input.recordId }},
  });
  if (!result.paymentUrl || !result.paymentUrl.startsWith('https://')) throw new CleaningError('The invoice payment link is unavailable. Contact 2Exclusive before retrying.',503);
  return { checkoutUrl:result.paymentUrl };
}
