import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Client | Elevate for Humanity',
  description: 'Add a new tax preparation client.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
