import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Admin | Email marketing | ${PLATFORM_DEFAULTS.orgName}`,
  description: `${PLATFORM_DEFAULTS.orgName} - Career training and workforce development programs.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/email-marketing',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
