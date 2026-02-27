import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Course Creator',
  description: 'Create and manage training courses.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
