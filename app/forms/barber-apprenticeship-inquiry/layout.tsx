import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship Inquiry | Elevate for Humanity',
  description: 'Submit an inquiry about the barber apprenticeship program.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
