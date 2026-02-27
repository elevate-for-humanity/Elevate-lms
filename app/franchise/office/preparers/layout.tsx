import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax Preparers | Elevate for Humanity',
  description: 'Manage tax preparers at your office.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
