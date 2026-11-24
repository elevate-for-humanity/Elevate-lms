import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LMS_HOST, MARKETING_HOST } from '@/lib/routing/portal-map';
import { learnerOnboardingBridge } from '@/lib/routing/learner-onboarding-bridge';

export const dynamic = 'force-dynamic';

/** The checklist, step actions, and completion screen remain Marketing-owned. */
export default async function LegacyLearnerOnboarding({ params, searchParams }: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ path }, query] = await Promise.all([params, searchParams]);
  const bridge = learnerOnboardingBridge({ path, searchParams: query, marketingHost: MARKETING_HOST, lmsHost: LMS_HOST });
  if (!bridge) notFound();
  // Do not require a profile: this is also the recovery destination for a
  // signed-in account whose profile has not been provisioned yet. The owning
  // checklist performs its existing role, application, and completion checks.
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user?.id) redirect('/login?redirect=' + encodeURIComponent(bridge.returnPath));
  redirect(bridge.destination);
}
