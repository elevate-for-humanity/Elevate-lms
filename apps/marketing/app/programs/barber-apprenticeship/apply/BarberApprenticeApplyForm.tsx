'use client';

import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { mapApplyFundingParam } from '@/lib/barber/apply-funding';
import ApprenticeForm from './ApprenticeForm';

export default function BarberApprenticeApplyForm() {
  const searchParams = useSafeSearchParams();
  return (
    <ApprenticeForm
      initialPayment={searchParams.get('payment')}
      initialFunding={mapApplyFundingParam(searchParams.get('funding'))}
      initialEmail={searchParams.get('email') ?? undefined}
      initialName={searchParams.get('name') ?? undefined}
      initialApplicationId={searchParams.get('application_id') ?? undefined}
    />
  );
}
