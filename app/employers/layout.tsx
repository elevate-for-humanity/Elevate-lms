import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For Employers',
  description: 'Employer partnership opportunities and talent pipeline.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
