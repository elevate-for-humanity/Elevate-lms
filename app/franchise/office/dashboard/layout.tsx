import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Office Dashboard | {PLATFORM_DEFAULTS.orgName}',
  description: 'Franchise office overview and metrics.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
