import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Your Next Steps | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    `Your personalized checklist for completing enrollment, submitting documents, and starting your career training program at ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/next-steps',
  },
  robots: { index: false },
};

export default function NextStepsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
