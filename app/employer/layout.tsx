import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employer Portal',
  description: 'Employer dashboard, hiring, and apprenticeship management.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
