import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FERPA',
  description: 'FERPA records management and compliance.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
