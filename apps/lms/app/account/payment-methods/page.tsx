import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { listApprenticeInvoices } from '@/lib/billing/apprentice-invoice-batch';
import { PaymentMethodsClient } from './PaymentMethodsClient';

export const dynamic = 'force-dynamic';

export default async function AccountPaymentMethodsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account/payment-methods');
  const db = await requireAdminClient();
  const [invoices, schedulesResult] = await Promise.all([
    listApprenticeInvoices(db, user.id),
    db.from('billing_schedules')
      .select('id,product_name,amount_cents,cadence,status,collection_mode,provider_status,provider_approval_url')
      .in('customer_external_key', [user.id, `user:${user.id}`])
      .eq('provider', 'quickbooks')
      .order('created_at', { ascending: false }),
  ]);
  if (schedulesResult.error) throw new Error('Could not load billing schedules.');
  return <PaymentMethodsClient invoices={invoices} schedules={schedulesResult.data || []} />;
}
