'use client';

import { TestingCartProvider } from '@/components/testing/TestingCart';

export default function TestingCartWrapper({ children }: { children: React.ReactNode }) {
  return <TestingCartProvider>{children}</TestingCartProvider>;
}
