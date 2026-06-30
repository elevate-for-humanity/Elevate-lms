import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Schedule',
  description: `Schedule a meeting with the ${PLATFORM_DEFAULTS.orgName} team to discuss enrollment, funding eligibility, or program options.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/schedule',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
