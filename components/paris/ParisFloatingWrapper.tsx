'use client';

import dynamic from 'next/dynamic';

const ParisFloatingButton = dynamic(
  () => import('./ParisFloatingButton').then((module) => module.ParisFloatingButton),
  { ssr: false },
);

export type ParisLearnerContext = {
  surface?: 'public' | 'learner';
  courseTitle?: string | null;
  nextLessonTitle?: string | null;
  courseProgress?: number | null;
};

export function ParisFloatingWrapper(props: ParisLearnerContext) {
  return <ParisFloatingButton {...props} />;
}

export default ParisFloatingWrapper;
