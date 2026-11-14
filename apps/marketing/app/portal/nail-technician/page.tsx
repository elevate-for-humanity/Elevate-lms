import { Metadata } from 'next';
import { ApprenticeshipProgramDashboard } from '@/components/apprenticeship/ApprenticeshipProgramDashboard';
import { loadApprenticeshipDashboard } from '@/lib/apprenticeship/load-apprenticeship-dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Nail Technician Apprenticeship Dashboard',
  description: 'Track your nail technician apprenticeship hours, competencies, RTI lessons, and training progress.',
  robots: { index: false, follow: false },
};

export default async function NailTechnicianPortalPage() {
  const data = await loadApprenticeshipDashboard('nail-technician-apprenticeship');
  return <ApprenticeshipProgramDashboard {...data} />;
}
