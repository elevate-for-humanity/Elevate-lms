import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Educational materials and supplies.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
