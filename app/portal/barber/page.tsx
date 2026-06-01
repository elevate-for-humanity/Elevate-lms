import { Metadata } from 'next';
import { BarberApprenticeshipDashboard } from '@/components/barber/BarberApprenticeshipDashboard';
import { loadBarberDashboardData } from '@/lib/barber/load-barber-dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Barber Apprenticeship Dashboard | Prestige Elevation™',
  description:
    'Barber apprenticeship dashboard — OJT hours, Prestige Elevation™ RTI on Elevate LMS, and onboarding.',
  robots: { index: false, follow: false },
};

export default async function BarberPortalPage() {
  const data = await loadBarberDashboardData();
  return <BarberApprenticeshipDashboard {...data} />;
}
