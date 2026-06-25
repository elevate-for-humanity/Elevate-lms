import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Tax Preparers | {PLATFORM_DEFAULTS.orgName}',
  description: 'Manage tax preparers at your office.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
