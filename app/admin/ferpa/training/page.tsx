import { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';
import FERPATrainingDashboard from '@/components/compliance/FERPATrainingDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'FERPA Training Management | Elevate For Humanity',
  description: 'Manage FERPA training, assessments, and compliance documentation',
};

export default async function FERPATrainingPage() {
  const { id: userId } = await requireAdmin();
  const db = await requireAdminClient();

  const [{ data: profile }, { data: trainingRecords }, { data: pendingUsers }] = await Promise.all([
    db.from('profiles').select('role, full_name').eq('id', userId).maybeSingle(),
    db
      .from('ferpa_training_records')
      .select(
        'id, user_id, status, quiz_score, completed_at, expires_at, profiles(full_name, email, role)',
      )
      .order('created_at', { ascending: false }) as any,
    db
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .not('id', 'in', `(SELECT user_id FROM ferpa_training_records WHERE status = 'completed')`)
      .in('role', ['staff', 'instructor', 'admin', 'super_admin'])
      .order('full_name') as any,
  ]);

  return (
    <>
      <FERPATrainingDashboard
        trainingRecords={trainingRecords ?? []}
        pendingUsers={pendingUsers ?? []}
        currentUser={profile}
      />
    </>
  );
}
