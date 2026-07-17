import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contracts & Agreements',
  description: 'Legal agreements, MOUs, and partnership contracts.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
