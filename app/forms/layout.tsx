import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forms',
  description: 'Application forms and submissions.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
