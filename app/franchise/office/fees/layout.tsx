import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fee Schedule | Elevate for Humanity',
  description: 'Manage tax preparation fee schedules.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
