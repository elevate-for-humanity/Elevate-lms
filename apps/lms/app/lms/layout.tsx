import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Learner Portal', template: '%s | Elevate Learner Portal' },
  description: 'Courses, progress, certifications, messages, schedules, and learner support.',
  manifest: '/manifest-student.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'Elevate Learn',
    statusBarStyle: 'black-translucent',
  },
};

export default function LearnerPortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
