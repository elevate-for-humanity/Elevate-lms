import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Chat | Elevate for Humanity',
  description: 'Chat with support and advisors.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
