import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Payments | Elevate for Humanity',
  description: 'Manage your billing and payment information.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
