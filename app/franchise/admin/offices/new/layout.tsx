import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Office | Elevate for Humanity',
  description: 'Register a new franchise office location.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
