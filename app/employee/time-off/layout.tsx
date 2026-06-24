import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Employee | Time off | {PLATFORM_DEFAULTS.orgName}',
  description: '{PLATFORM_DEFAULTS.orgName} - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employee/time-off',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
