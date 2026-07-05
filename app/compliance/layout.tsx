import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compliance',
  description: 'Compliance documentation and regulatory requirements.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
