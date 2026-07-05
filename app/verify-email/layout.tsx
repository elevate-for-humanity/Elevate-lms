import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address for your Elevate account.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
