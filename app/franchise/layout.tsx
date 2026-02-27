import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Franchise Management | Supersonic Fast Cash',
  description: 'Supersonic Fast Cash franchise management portal.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
