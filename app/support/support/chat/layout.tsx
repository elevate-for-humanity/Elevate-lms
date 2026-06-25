import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Support Chat | {PLATFORM_DEFAULTS.orgName}',
  description: 'Get help from our support team.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
