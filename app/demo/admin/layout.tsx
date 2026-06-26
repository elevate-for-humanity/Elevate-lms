import { Metadata } from 'next';
import { DemoTourProvider } from '@/components/demo/DemoTourProvider';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Demo | Admin | {PLATFORM_DEFAULTS.orgName}',
  description: 'Public demo of the Elevate admin dashboard using sample data.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/demo/admin',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoAdminLayout({ children }: { children: React.ReactNode }) {
  return <DemoTourProvider>{children}</DemoTourProvider>;
}
