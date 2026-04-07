import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Learner Portal | Elevate For Humanity',
  description: 'Access your courses, track progress, and manage your career training journey.',
  robots: { index: false, follow: false },
};

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
