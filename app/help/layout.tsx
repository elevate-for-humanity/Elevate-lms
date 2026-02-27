import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Help and support resources.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
