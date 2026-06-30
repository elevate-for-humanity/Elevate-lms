import { Metadata } from 'next';
import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Apprentice Portal',
  description: 'Track your apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default async function ApprenticePortalPage() {
  // Resolve the correct program slug from the user's active enrollment
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/portal/apprentice');

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('program_slug')
    .eq('user_id', user.id)
    .eq('enrollment_state', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const programSlug = enrollment?.program_slug ?? 'barber-apprenticeship';
  const data = await loadApprenticePortalData(programSlug);
  return <ApprenticePortalShell {...data} />;
}
