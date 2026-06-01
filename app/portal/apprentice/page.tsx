import { Metadata } from 'next';
import { ApprenticeshipProgramDashboard } from '@/components/apprenticeship/ApprenticeshipProgramDashboard';
import { loadApprenticeshipDashboard } from '@/lib/apprenticeship/load-apprenticeship-dashboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Apprentice Portal',
  description: 'Track your apprenticeship hours, competencies, RTI lessons, and training progress.',
  robots: { index: false, follow: false },
};

export default async function ApprenticePortalPage() {
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
  const data = await loadApprenticeshipDashboard(programSlug);
  return <ApprenticeshipProgramDashboard {...data} />;
}
