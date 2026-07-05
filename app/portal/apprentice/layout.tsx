import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Apprentice Portal — ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Track your apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default function ApprenticePortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
