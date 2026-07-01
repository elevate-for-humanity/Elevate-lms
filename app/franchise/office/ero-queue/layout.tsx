import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'ERO Queue | {PLATFORM_DEFAULTS.orgName}',
  description: 'Electronic Return Originator processing queue.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
