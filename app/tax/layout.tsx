import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax Services',
  description: 'Tax preparation and filing services.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
