import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Manage your Elevate for Humanity account.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
