import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses',
  description: 'Browse and enroll in career training courses.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
