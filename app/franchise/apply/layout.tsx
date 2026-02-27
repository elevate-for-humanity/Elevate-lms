import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Franchise Application | Elevate for Humanity',
  description: 'Apply to become a Supersonic Fast Cash franchise partner.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
