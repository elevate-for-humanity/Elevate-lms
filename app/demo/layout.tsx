import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Demo',
  description: 'Interactive demo of the Elevate for Humanity platform.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
