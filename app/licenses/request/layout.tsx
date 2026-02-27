import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Request License | Elevate for Humanity',
  description: 'Request a platform license.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
