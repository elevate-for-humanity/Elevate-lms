'use client';

import { ProgramBnplPageClient } from '@/components/payments/ProgramBnplPageClient';
import { TUITION_CENTS, TUITION_DOLLARS } from '@/lib/cosmetology/pricing';

export function BnplPageClient() {
  return (
    <ProgramBnplPageClient
      programName="Cosmetology Apprenticeship"
      programLabel="Cosmetology Apprenticeship"
      amountCents={TUITION_CENTS}
      amountDollars={TUITION_DOLLARS}
      checkoutEndpoint="/api/cosmetology/checkout/embedded"
      applyHref="/programs/cosmetology-apprenticeship/apply"
      successPath="/programs/cosmetology-apprenticeship/apply/success"
      paymentPlanHref="/programs/cosmetology-apprenticeship/payment-setup"
      payInFullHref="/programs/cosmetology-apprenticeship/apply?payment=full"
    />
  );
}
