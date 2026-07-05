import { Metadata } from 'next';
import { ApprenticeshipProgramDashboard } from '@/components/apprenticeship/ApprenticeshipProgramDashboard';
import { loadApprenticeshipDashboard } from '@/lib/apprenticeship/load-apprenticeship-dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Barber Apprenticeship Dashboard',
  description: 'Track your barber apprenticeship hours, competencies, RTI lessons, and training progress.',
  robots: { index: false, follow: false },
};

export default async function BarberPortalPage() {
  const data = await loadApprenticeshipDashboard('barber-apprenticeship');
  return <ApprenticeshipProgramDashboard {...data} />;
}
