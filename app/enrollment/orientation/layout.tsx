import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orientation | Elevate for Humanity',
  description: 'Complete your program orientation.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
