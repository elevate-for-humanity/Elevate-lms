import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Tax Returns | {PLATFORM_DEFAULTS.orgName}',
  description: 'Manage filed tax returns.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
