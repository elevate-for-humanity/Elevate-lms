import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clients | Elevate for Humanity',
  description: 'Manage tax preparation clients.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
