'use client';

import { ParisFloatingButton } from './ParisFloatingButton';

export type ParisLearnerContext = {
  surface?: 'public' | 'learner' | 'portal';
  portalRole?: string | null;
  courseTitle?: string | null;
  nextLessonTitle?: string | null;
  courseProgress?: number | null;
};

export function ParisFloatingWrapper(props: ParisLearnerContext) {
  return <ParisFloatingButton {...props} />;
}

export default ParisFloatingWrapper;
