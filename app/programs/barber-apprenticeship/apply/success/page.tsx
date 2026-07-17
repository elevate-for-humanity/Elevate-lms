export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import BarberApplySuccessClient from './BarberApplySuccessClient';

export const metadata: Metadata = {
  title: 'Application Received | Barber Apprenticeship',
  description: 'Your barber apprenticeship application has been received. Check your email for next steps.',
  robots: { index: false },
};

export default function BarberApplySuccessPage() {
  return <BarberApplySuccessClient />;
}
