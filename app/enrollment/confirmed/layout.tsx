import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enrollment Confirmed | Elevate for Humanity',
  description: 'Your enrollment has been confirmed.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
