import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Reset Browser',
  description: `Clear browser cache, cookies, and local storage for ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/reset',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
