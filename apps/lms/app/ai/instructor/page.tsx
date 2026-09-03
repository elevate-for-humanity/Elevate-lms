import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LegacyLmsAIInstructor() {
  permanentRedirect('https://www.elevateforhumanity.org/ai/instructor');
}
