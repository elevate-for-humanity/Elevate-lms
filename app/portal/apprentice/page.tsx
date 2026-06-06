import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  apprenticePortalPathForSlug,
  resolveApprenticeProgramSlug,
} from '@/lib/portal/resolve-apprentice-program-slug';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Apprentice Portal',
  description: 'Track your apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

/**
 * Generic apprentice entry — resolves enrollment and forwards to the
 * program-specific portal (/portal/barber, /portal/cosmetology, …).
 * Never defaults to barber when enrollment is missing.
 */
export default async function ApprenticePortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login/apprentice');

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  const portalPath = apprenticePortalPathForSlug(programSlug);

  if (portalPath && portalPath !== '/portal/apprentice') {
    redirect(portalPath);
  }

  if (!programSlug) {
    redirect('/portals');
  }

  redirect('/learner/dashboard');
}
