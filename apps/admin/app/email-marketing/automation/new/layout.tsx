import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: ` | ${PLATFORM_DEFAULTS.orgName}`,
  description: `${PLATFORM_DEFAULTS.orgName} - Career training and workforce development programs.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
