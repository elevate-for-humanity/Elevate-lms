import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment',
  description: 'Payment processing and billing.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
