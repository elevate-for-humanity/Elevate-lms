import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agreements | Elevate for Humanity',
  description: 'Legal agreements and terms.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
