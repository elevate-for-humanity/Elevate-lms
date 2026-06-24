import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thank You | Marketplace | Elevate For Humanity',
  description: 'Thank you for your purchase from the Elevate marketplace.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
