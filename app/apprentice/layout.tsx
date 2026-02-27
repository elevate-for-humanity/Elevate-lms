import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apprentice Portal',
  description: 'Apprentice dashboard, hours, documents, and training.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
