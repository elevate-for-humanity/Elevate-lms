import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Rise Foundation',
  description: 'The Rise Foundation community programs and VITA services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
