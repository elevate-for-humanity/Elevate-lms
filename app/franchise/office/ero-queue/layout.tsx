import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ERO Queue | Elevate for Humanity',
  description: 'Electronic Return Originator processing queue.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
