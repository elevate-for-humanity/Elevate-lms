import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Banking Services',
  description: 'Banking and financial services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
