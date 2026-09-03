import { Metadata } from 'next';
import { ApprenticeshipProgramDashboard } from '@/components/apprenticeship/ApprenticeshipProgramDashboard';
import { loadApprenticeshipDashboard } from '@/lib/apprenticeship/load-apprenticeship-dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Esthetician Apprenticeship Dashboard',
  description: 'Track your esthetician apprenticeship hours, competencies, RTI lessons, and training progress.',
  robots: { index: false, follow: false },
};

export default async function EstheticianPortalPage() {
  const data = await loadApprenticeshipDashboard('esthetician-apprenticeship');
  return <ApprenticeshipProgramDashboard {...data} />;
}
