import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Messaging and communication.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
