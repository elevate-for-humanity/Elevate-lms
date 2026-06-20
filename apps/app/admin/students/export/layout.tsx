import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Admin | Students | Export | ${PLATFORM_DEFAULTS.orgName}`,
  description: `${PLATFORM_DEFAULTS.orgName} - Career training and workforce development programs.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/students/export',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
