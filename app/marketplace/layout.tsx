import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Course marketplace and educational products.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
