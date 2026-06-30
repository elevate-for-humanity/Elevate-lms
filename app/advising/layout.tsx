import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Free Career Advising',
  description:
    `Talk with an ${PLATFORM_DEFAULTS.orgName} advisor about program options, funding eligibility, and your next steps toward a new career.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/advising',
  },
};

export default function AdvisingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
