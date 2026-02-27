import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Course Creator | Elevate for Humanity',
  description: 'Create and manage your courses.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
