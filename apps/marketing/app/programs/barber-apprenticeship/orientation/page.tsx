import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import BarberOrientationClient from './OrientationClient';
import type { BarberPaymentSummary } from './OrientationClient';
import { BARBER_PRICING } from '@/lib/programs/pricing';

export const dynamic = 'force-dynamic';

export default async function BarberOrientationPage() {
  const supabase = await createClient();
  const db = await getAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Must be logged in
  if (!user) {
    redirect('/login?redirect=/programs/barber-apprenticeship/orientation');
  }

  // Look up the student's subscription — payment is required to access orientation
  const { data: sub } = await db
    .from('barber_subscriptions')
    .select('amount_paid_at_checkout, remaining_balance, weekly_payment_cents, weeks_remaining, fully_paid')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // No payment on file — send them back to complete checkout
  if (!sub) {
    redirect('/programs/barber-apprenticeship/apply/apprentice?reason=payment_required');
  }

  const payment: BarberPaymentSummary = {
    downPayment:        sub.amount_paid_at_checkout ?? BARBER_PRICING.minDownPayment,
    remainingBalance:   sub.remaining_balance ?? (BARBER_PRICING.fullPrice - (sub.amount_paid_at_checkout ?? BARBER_PRICING.minDownPayment)),
    weeklyPaymentCents: sub.weekly_payment_cents ?? Math.round(((BARBER_PRICING.fullPrice - BARBER_PRICING.minDownPayment) / BARBER_PRICING.paymentTermWeeks) * 100),
    weeksRemaining:     sub.weeks_remaining ?? BARBER_PRICING.paymentTermWeeks,
    fullyPaid:          sub.fully_paid ?? false,
  };

  return <BarberOrientationClient payment={payment} />;
}
