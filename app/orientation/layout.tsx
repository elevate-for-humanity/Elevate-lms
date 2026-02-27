import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orientation',
  description: 'Program orientation and onboarding.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
