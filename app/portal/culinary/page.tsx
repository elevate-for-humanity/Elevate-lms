import { Metadata } from 'next';
import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Culinary Apprenticeship Dashboard',
  description: 'Track your culinary apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default async function CulinaryPortalPage() {
  const data = await loadApprenticePortalData('culinary-apprenticeship');
  return <ApprenticePortalShell {...data} />;
}
