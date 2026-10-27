import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'AI Team | Elevate LMS',
  robots: { index: false, follow: false },
};

/** Compatibility route: learner AI belongs to the authenticated AI Team workspace. */
export default function LegacyLearnerAiChatRoute() {
  permanentRedirect('/lms/ai-team');
}
