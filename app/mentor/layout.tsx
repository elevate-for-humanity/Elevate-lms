import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentorship',
  description: 'Mentorship program and mentor matching.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
