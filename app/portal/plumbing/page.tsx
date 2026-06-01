import { Metadata } from 'next';
import { ApprenticeshipProgramDashboard } from '@/components/apprenticeship/ApprenticeshipProgramDashboard';
import { loadApprenticeshipDashboard } from '@/lib/apprenticeship/load-apprenticeship-dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Plumbing Apprenticeship Dashboard',
  description: 'Track your plumbing apprenticeship hours, competencies, RTI lessons, and training progress.',
  robots: { index: false, follow: false },
};

export default async function PlumbingPortalPage() {
  const data = await loadApprenticeshipDashboard('plumbing');
  return <ApprenticeshipProgramDashboard {...data} />;
}
