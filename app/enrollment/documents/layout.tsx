import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enrollment Documents | Elevate for Humanity',
  description: 'Upload required enrollment documents.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
