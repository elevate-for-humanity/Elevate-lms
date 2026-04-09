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

  let payment: BarberPaymentSummary = {
    downPayment:         BARBER_PRICING.minDownPayment,
    remainingBalance:    BARBER_PRICING.fullPrice - BARBER_PRICING.minDownPayment,
    weeklyPaymentCents:  Math.round(((BARBER_PRICING.fullPrice - BARBER_PRICING.minDownPayment) / BARBER_PRICING.paymentTermWeeks) * 100),
    weeksRemaining:      BARBER_PRICING.paymentTermWeeks,
    fullyPaid:           false,
  };

  if (user) {
    // Look up the student's actual subscription record to get their real down payment
    const { data: sub } = await db
      .from('barber_subscriptions')
      .select('amount_paid_at_checkout, remaining_balance, weekly_payment_cents, weeks_remaining, fully_paid')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sub) {
      payment = {
        downPayment:        sub.amount_paid_at_checkout ?? BARBER_PRICING.minDownPayment,
        remainingBalance:   sub.remaining_balance ?? (BARBER_PRICING.fullPrice - (sub.amount_paid_at_checkout ?? BARBER_PRICING.minDownPayment)),
        weeklyPaymentCents: sub.weekly_payment_cents ?? payment.weeklyPaymentCents,
        weeksRemaining:     sub.weeks_remaining ?? BARBER_PRICING.paymentTermWeeks,
        fullyPaid:          sub.fully_paid ?? false,
      };
    }
  }

  return <BarberOrientationClient payment={payment} />;
}
