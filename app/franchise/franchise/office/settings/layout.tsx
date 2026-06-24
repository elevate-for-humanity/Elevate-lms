import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Office Settings | {PLATFORM_DEFAULTS.orgName}',
  description: 'Configure franchise office settings.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
