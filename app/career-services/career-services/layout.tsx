import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Services',
  description: 'Career counseling, job placement, and employment support.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
