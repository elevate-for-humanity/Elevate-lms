import { Metadata } from 'next';
import { ApprenticeshipProgramDashboard } from '@/components/apprenticeship/ApprenticeshipProgramDashboard';
import { loadApprenticeshipDashboard } from '@/lib/apprenticeship/load-apprenticeship-dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Electrical Apprenticeship Dashboard',
  description: 'Track your electrical apprenticeship hours, competencies, RTI lessons, and training progress.',
  robots: { index: false, follow: false },
};

export default async function ElectricalPortalPage() {
  const data = await loadApprenticeshipDashboard('electrical');
  return <ApprenticeshipProgramDashboard {...data} />;
}
