import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Handbook | Elevate for Humanity',
  description: 'Review the student handbook and policies.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
