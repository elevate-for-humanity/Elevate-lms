'use client';

import { ProgramBnplPageClient } from '@/components/payments/ProgramBnplPageClient';
import { TUITION_CENTS, TUITION_DOLLARS } from '@/lib/barber/pricing';

export function BnplPageClient() {
  return (
    <ProgramBnplPageClient
      programName="Barber Apprenticeship"
      programLabel="Barber Apprenticeship"
      amountCents={TUITION_CENTS}
      amountDollars={TUITION_DOLLARS}
      checkoutEndpoint="/api/barber/checkout/embedded"
      applyHref="/programs/barber-apprenticeship/apply"
      successPath="/programs/barber-apprenticeship/apply/success"
      paymentPlanHref="/programs/barber-apprenticeship/payment-setup"
      payInFullHref="/programs/barber-apprenticeship/apply?payment=full"
    />
  );
}
