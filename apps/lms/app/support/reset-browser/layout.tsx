import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Reset Browser',
  description: `Clear browser cache, cookies, and local storage for ${PLATFORM_DEFAULTS.orgName}.`,
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
