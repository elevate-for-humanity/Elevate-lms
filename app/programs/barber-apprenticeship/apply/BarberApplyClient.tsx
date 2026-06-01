'use client';

import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { mapApplyFundingParam } from '@/lib/barber/apply-funding';
import ApprenticeForm from './ApprenticeForm';

// Reads ?payment=, ?reason=, ?email=, ?name=, ?application_id= from the URL.
// ?reason=payment_required is set when orientation redirects back due to no payment on file.
// ?email=, ?name=, ?application_id= pre-fill the form and skip straight to checkout.
export default function BarberApplyClient() {
  const searchParams = useSafeSearchParams();
  const payment = searchParams.get('payment');
  const reason = searchParams.get('reason');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const applicationId = searchParams.get('application_id');

  return (
    <>
      {reason === 'payment_required' && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-sm font-medium">
            Payment is required to access orientation. Please complete your enrollment below.
          </div>
        </div>
      )}
      <ApprenticeForm
        initialPayment={payment}
        initialEmail={email ?? undefined}
        initialName={name ?? undefined}
        initialApplicationId={applicationId ?? undefined}
      />
    </>
  );
}
