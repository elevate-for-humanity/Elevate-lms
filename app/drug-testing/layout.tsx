import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drug Testing',
  description: 'Drug testing services and employer programs.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
