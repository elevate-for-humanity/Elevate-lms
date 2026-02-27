import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Writing Center | Elevate for Humanity',
  description: 'Writing assistance and resources.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
