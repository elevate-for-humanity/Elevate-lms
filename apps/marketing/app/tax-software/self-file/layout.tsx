import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { absolute: 'Your Tax Return | Supersonic Fast Cash' },
  description: 'Prepare and review your tax information in your private Supersonic Fast Cash workspace.',
  robots: { index: false, follow: false },
};

export default function TaxReturnLayout({ children }: { children: ReactNode }) {
  return children;
}
