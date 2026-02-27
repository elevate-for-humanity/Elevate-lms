import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform',
  description: 'Elevate for Humanity platform features and tools.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
