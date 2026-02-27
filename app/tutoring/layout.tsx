import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutoring Services | Elevate for Humanity',
  description: 'Access tutoring and academic support.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
