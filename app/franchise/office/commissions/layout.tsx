import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commissions | Elevate for Humanity',
  description: 'View and manage franchise commissions.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
