import type { Metadata } from 'next';
import { requireDemo } from '@/lib/demo/requireDemo';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Platform Demo | {PLATFORM_DEFAULTS.orgName}',
  description: 'Interactive demo of the {PLATFORM_DEFAULTS.orgName} platform.',
  robots: { index: false, follow: false },
};

export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  await requireDemo();
  return children;
}
