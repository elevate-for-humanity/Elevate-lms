import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enrollment Agreements | Elevate for Humanity',
  description: 'Review and sign enrollment agreements.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
