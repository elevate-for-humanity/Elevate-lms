import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Elevate for Humanity, our team, and our mission.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
