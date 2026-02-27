import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Agreements | Elevate for Humanity',
  description: 'Review and accept legal agreements.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
