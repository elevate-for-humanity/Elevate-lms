import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payouts | Elevate for Humanity',
  description: 'View and manage franchise payouts.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
