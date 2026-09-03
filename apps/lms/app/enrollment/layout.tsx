import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enrollment',
  description: 'Program enrollment and registration.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
