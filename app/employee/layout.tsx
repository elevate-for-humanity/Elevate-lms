import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employee Portal',
  description: 'Employee resources and management.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
