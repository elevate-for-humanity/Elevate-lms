import { Metadata } from 'next';
import { DemoTourProvider } from '@/components/demo/DemoTourProvider';

export const metadata: Metadata = {
  title: 'Demo | Employer | Elevate for Humanity',
  description: 'Public demo of the Elevate employer portal using sample data.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/demo/employer',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoEmployerLayout({ children }: { children: React.ReactNode }) {
  return <DemoTourProvider>{children}</DemoTourProvider>;
}
