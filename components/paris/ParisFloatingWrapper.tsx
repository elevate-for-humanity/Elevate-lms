'use client';

import { ParisFloatingButton } from './ParisFloatingButton';

export type ParisLearnerContext = {
  surface?: 'public' | 'learner' | 'portal';
  portalRole?: string | null;
  personName?: string | null;
  courseTitle?: string | null;
  nextLessonTitle?: string | null;
  courseProgress?: number | null;
  autoOpenOnDashboard?: boolean;
};

export function ParisFloatingWrapper(props: ParisLearnerContext) {
  // Admins can move between holder previews without a full page reload. Key the
  // assistant by the visible portal identity so its welcome message and memory
  // cannot carry the previous holder's name into the next dashboard.
  const identityKey = `${props.surface ?? 'public'}:${props.portalRole ?? ''}:${props.personName ?? ''}`;

  return <ParisFloatingButton key={identityKey} {...props} />;
}

export default ParisFloatingWrapper;
