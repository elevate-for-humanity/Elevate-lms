import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Franchise Offices | Elevate for Humanity',
  description: 'Manage franchise office locations.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
