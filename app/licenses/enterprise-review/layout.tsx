import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enterprise License Review | Elevate for Humanity',
  description: 'Review enterprise licensing options.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
