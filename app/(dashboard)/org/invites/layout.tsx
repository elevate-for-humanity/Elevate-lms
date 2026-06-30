import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: '',
  description: `${PLATFORM_DEFAULTS.orgName} - Career training and workforce development programs.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
