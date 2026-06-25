import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Payouts | {PLATFORM_DEFAULTS.orgName}',
  description: 'View and manage franchise payouts.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
