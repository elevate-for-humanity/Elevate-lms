import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credentials',
  description: 'Credential standards and verification.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
