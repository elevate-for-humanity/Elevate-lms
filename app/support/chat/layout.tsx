import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Chat | Elevate for Humanity',
  description: 'Get help from our support team.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
