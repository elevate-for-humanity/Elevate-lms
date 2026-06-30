import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Account',
  description: `Manage your ${PLATFORM_DEFAULTS.orgName} account.`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
