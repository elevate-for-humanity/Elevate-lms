import type { Metadata } from 'next';
import type { ReactNode } from 'react';
export const metadata: Metadata = {
  title: 'Tax Preparation Walkthrough | Supersonic Fast Cash',
  description:
    'Explore the preparation steps, document review and fee decisions before starting your tax workspace. This walkthrough does not file a return.',
  alternates: { canonical: '/tax-software/demo' },
};
export default function DemoLayout({ children }: { children: ReactNode }) {
  return children;
}
