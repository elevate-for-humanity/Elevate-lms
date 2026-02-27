import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For Students | Elevate for Humanity',
  description: 'Career training programs and resources for students.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
