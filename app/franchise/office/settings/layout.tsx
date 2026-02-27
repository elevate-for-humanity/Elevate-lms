import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Office Settings | Elevate for Humanity',
  description: 'Configure franchise office settings.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
