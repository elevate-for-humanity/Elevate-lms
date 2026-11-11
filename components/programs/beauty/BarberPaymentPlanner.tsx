'use client';

import PaymentPlanCalculator from '@/components/programs/PaymentPlanCalculator';

/** Legacy entry point shares standard deposits and server-validated coupons. */
export default function BarberPaymentPlanner() {
  return <PaymentPlanCalculator programSlug="barber-apprenticeship" />;
}
