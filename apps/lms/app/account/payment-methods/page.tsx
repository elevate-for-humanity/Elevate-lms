import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PaymentMethodsClient } from './PaymentMethodsClient';

export const dynamic = 'force-dynamic';

export default async function AccountPaymentMethodsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account/payment-methods');
  const { data } = await supabase
    .from('user_billing_customers')
    .select('stripe_default_payment_method_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return <PaymentMethodsClient configured={Boolean(data?.stripe_default_payment_method_id)} />;
}
