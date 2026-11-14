import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orientation',
  description: 'Complete your program orientation.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
