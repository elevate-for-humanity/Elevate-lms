import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax Returns | Elevate for Humanity',
  description: 'Manage filed tax returns.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
