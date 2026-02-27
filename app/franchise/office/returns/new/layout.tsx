import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Return | Elevate for Humanity',
  description: 'Start a new tax return.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
