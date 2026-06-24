import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'New Office | {PLATFORM_DEFAULTS.orgName}',
  description: 'Register a new franchise office location.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
