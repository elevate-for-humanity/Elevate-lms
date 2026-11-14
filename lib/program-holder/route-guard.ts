/**
 * PROGRAM HOLDER ROUTE GUARD
 *
 * Reusable function to protect program holder routes.
 * Call this at the top of any protected page component.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProgramHolderOnboardingStatus } from './onboarding-status';

/**
 * Protect a program holder route
 *
 * Checks authentication, role, and onboarding completion.
 * Redirects to appropriate page if any check fails.
 *
 * @throws Redirects if not authorized
 */
export async function requireProgramHolderAccess(): Promise<void> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/program-holder/dashboard');
  }

  // Check onboarding status
  const status = await getProgramHolderOnboardingStatus(user.id);

  if (!status.onboardingComplete) {
    redirect(status.nextStepRoute || '/program-holder/onboarding');
  }
}

/**
 * Get program holder user ID (with checks)
 *
 * @returns User ID if authorized, redirects otherwise
 */
export async function getProgramHolderUserId(): Promise<string> {
  await requireProgramHolderAccess();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user!.id; // Safe because requireProgramHolderAccess ensures user exists
}
