export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function OrientationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const db = await getAdminClient();

  if (!supabase) {
    redirect('/login?redirect=/programs/barber-apprenticeship/orientation');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/programs/barber-apprenticeship/orientation');
  }

  // Verify user has an enrollment for this program
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, enrollment_state, payment_status, orientation_completed_at')
    .eq('user_id', user.id)
    .eq('program_slug', 'barber-apprenticeship')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // No enrollment — redirect to apply
  if (!enrollment) {
    redirect('/programs/barber-apprenticeship/apply/apprentice');
  }

  // Must have paid (payment_status = paid/partial) or be in an active state
  const allowedStates = ['onboarding', 'enrolled', 'active', 'orientation_complete', 'documents_complete'];
  const hasPaid = ['paid', 'partial', 'setup_fee_paid'].includes(enrollment.payment_status ?? '');
  if (!hasPaid && !allowedStates.includes(enrollment.enrollment_state ?? '')) {
    redirect('/programs/barber-apprenticeship/payment-setup');
  }

  // Already completed orientation — redirect to documents
  if (enrollment.orientation_completed_at) {
    redirect('/programs/barber-apprenticeship/documents');
  }

  return <>{children}</>;
}
