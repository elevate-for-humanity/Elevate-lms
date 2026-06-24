import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'New Client | {PLATFORM_DEFAULTS.orgName}',
  description: 'Add a new tax preparation client.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
