import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Course Creator | {PLATFORM_DEFAULTS.orgName}',
  description: 'Create and manage your courses.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
