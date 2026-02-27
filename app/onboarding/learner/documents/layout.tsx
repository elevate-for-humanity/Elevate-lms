import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Required Documents | Elevate for Humanity',
  description: 'Upload required onboarding documents.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
