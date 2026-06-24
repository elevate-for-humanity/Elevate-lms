import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'New Return | {PLATFORM_DEFAULTS.orgName}',
  description: 'Start a new tax return.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
