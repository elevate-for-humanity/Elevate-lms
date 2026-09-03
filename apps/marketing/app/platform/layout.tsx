import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Platform',
  description: '{PLATFORM_DEFAULTS.orgName} platform features and tools.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
