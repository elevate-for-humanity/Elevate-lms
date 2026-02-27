import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Office Dashboard | Elevate for Humanity',
  description: 'Franchise office overview and metrics.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
