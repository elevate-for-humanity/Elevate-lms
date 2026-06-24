import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'New Preparer | {PLATFORM_DEFAULTS.orgName}',
  description: 'Add a new tax preparer to your office.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
