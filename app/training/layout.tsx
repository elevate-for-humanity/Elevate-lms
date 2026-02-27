import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Training',
  description: 'Training programs and professional development.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
