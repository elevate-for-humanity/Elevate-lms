import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Clients | {PLATFORM_DEFAULTS.orgName}',
  description: 'Manage tax preparation clients.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
