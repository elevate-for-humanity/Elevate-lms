import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Start Your Application',
  description:
    `Begin your application for career training programs at ${PLATFORM_DEFAULTS.orgName}. Funding may be available through WIOA, grants, or employer sponsorship.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/inquiry',
  },
};

export default function InquiryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
