import { Metadata } from 'next';
import { DemoTourProvider } from '@/components/demo/DemoTourProvider';

export const metadata: Metadata = {
  title: 'Demo | Admin | Elevate for Humanity',
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
