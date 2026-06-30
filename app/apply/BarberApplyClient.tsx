'use client';

import ApprenticeForm from '@/app/programs/barber-apprenticeship/apply/ApprenticeForm';

export default function BarberApplyClient({ payment }: { payment: string | null }) {
  return <ApprenticeForm initialPayment={payment} />;
}
