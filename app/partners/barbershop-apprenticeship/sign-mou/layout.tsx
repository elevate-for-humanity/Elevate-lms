import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign MOU | Elevate for Humanity',
  description: 'Sign the Memorandum of Understanding for the barbershop apprenticeship.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
