import { Metadata } from 'next';
import { ApprenticeshipProgramDashboard } from '@/components/apprenticeship/ApprenticeshipProgramDashboard';
import { loadApprenticeshipDashboard } from '@/lib/apprenticeship/load-apprenticeship-dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Culinary Apprenticeship Dashboard',
  description: 'Track your culinary apprenticeship hours, competencies, RTI lessons, and training progress.',
  robots: { index: false, follow: false },
};

export default async function CulinaryPortalPage() {
  const data = await loadApprenticeshipDashboard('culinary-apprenticeship');
  return <ApprenticeshipProgramDashboard {...data} />;
}
