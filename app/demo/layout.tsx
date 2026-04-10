import type { Metadata } from 'next';
import { requireDemo } from '@/lib/demo/requireDemo';

export const metadata: Metadata = {
  title: 'Platform Demo | Elevate for Humanity',
  description: 'Interactive demo of the Elevate for Humanity platform.',
  robots: { index: false, follow: false },
};

export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  await requireDemo();
  return children;
}
