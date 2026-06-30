import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    `Contact ${PLATFORM_DEFAULTS.orgName} for program applications, enrollment support, partnerships, employer hiring, and workforce training questions.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
