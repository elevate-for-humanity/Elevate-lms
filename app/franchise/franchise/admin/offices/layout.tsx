import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Franchise Offices | {PLATFORM_DEFAULTS.orgName}',
  description: 'Manage franchise office locations.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
