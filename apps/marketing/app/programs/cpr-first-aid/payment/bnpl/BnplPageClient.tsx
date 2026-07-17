'use client';

import { ProgramBnplPageClient } from '@/components/payments/ProgramBnplPageClient';
import { CPR_PRICE_CENTS, CPR_PRICE_DOLLARS } from '@/lib/cpr/pricing';

export function BnplPageClient() {
  return (
    <ProgramBnplPageClient
      programName="CPR & First Aid Certification"
      programLabel="CPR & First Aid"
      amountCents={CPR_PRICE_CENTS}
      amountDollars={CPR_PRICE_DOLLARS}
      checkoutEndpoint="/api/cpr/checkout/embedded"
      applyHref="/apply?program=cpr-first-aid"
      successPath="/apply"
      paymentPlanHref="/apply?program=cpr-first-aid"
      payInFullHref="/apply?program=cpr-first-aid&payment=full"
    />
  );
}
