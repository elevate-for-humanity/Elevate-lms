import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Fee Schedule | {PLATFORM_DEFAULTS.orgName}',
  description: 'Manage tax preparation fee schedules.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
