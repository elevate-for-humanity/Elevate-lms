import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dev Studio,
  description: 'AI-powered development environment for the Elevate platform.',
  alternates: { canonical: '/store/dev-studio' },
};

/**
 * Compatibility route.
 * The canonical public Dev Studio product page lives at `/dev-studio`.
 * Keep this route to preserve existing inbound links while eliminating
 * a second copy of the same marketing content.
 */
export default function DevStudioAiCompatibilityRoute() {
  redirect('/store/dev-studio');
}
