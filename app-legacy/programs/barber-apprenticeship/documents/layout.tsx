export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const db = await getAdminClient();

  if (!supabase) {
    redirect('/login?redirect=/programs/barber-apprenticeship/documents');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/programs/barber-apprenticeship/documents');
  }

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, enrollment_state, payment_status, orientation_completed_at, documents_submitted_at')
    .eq('user_id', user.id)
    .eq('program_slug', 'barber-apprenticeship')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // No enrollment — redirect to apply
  if (!enrollment) {
    redirect('/programs/barber-apprenticeship/apply/apprentice');
  }

  // Must complete orientation first
  if (!enrollment.orientation_completed_at) {
    redirect('/programs/barber-apprenticeship/orientation');
  }

  // Already submitted documents — redirect to dashboard
  if (enrollment.documents_submitted_at) {
    redirect('/apprentice');
  }

  return <>{children}</>;
}
