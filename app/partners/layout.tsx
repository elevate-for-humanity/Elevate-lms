import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partners',
  description: 'Training partners and partnership opportunities.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
