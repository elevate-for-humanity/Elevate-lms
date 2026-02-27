import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Preparer | Elevate for Humanity',
  description: 'Add a new tax preparer to your office.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
