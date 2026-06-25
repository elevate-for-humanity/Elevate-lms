import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal',
  description: 'Legal documents, terms, and agreements.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
