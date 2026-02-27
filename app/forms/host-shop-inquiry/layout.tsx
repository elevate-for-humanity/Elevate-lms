import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Host Shop Inquiry | Elevate for Humanity',
  description: 'Apply to become a host shop for barber apprentices.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
