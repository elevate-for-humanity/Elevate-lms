import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Franchise Application | {PLATFORM_DEFAULTS.orgName}',
  description: 'Apply to become a Supersonic Fast Cash franchise partner.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
