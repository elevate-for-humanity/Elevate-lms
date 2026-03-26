export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

// /onboarding/legal was a duplicate of /onboarding/learner/agreements.
// Redirect permanently to the canonical page.
export default function LegalOnboardingRedirect() {
  redirect('/onboarding/learner/agreements');
}
