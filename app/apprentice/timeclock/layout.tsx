import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apprentice Time Clock | Elevate for Humanity',
  description: 'Log and track your apprenticeship hours.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
