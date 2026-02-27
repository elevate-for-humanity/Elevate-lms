import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barbershop Apprenticeship Forms | Elevate for Humanity',
  description: 'Required forms for the barbershop apprenticeship program.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
