import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
